
import type { EmbeddedPrompt } from './types/DocTypes';

export default function promptDecode(data: ArrayBuffer): EmbeddedPrompt | null {
    const view = new DataView(data);
    const uint8 = new Uint8Array(data);

    // Check for PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (view.byteLength > 8 && view.getUint32(0) === 0x89504E47 && view.getUint32(4) === 0x0D0A1A0A) {
        return extractPng(view, uint8);
    } 
    // Check for JPEG signature: FF D8
    else if (view.byteLength > 2 && view.getUint16(0) === 0xFFD8) {
        return extractJpeg(view, uint8);
    }

    return null;
}

function extractPng(view: DataView, uint8: Uint8Array) {
    let offset = 8; // Skip signature
    const chunks: { keyword: string, text: string }[] = [];

    while (offset < view.byteLength) {
        if (offset + 8 > view.byteLength) break;
        
        const length = view.getUint32(offset);
        const type = getAsciiString(uint8, offset + 4, 4);
        
        if (type === 'tEXt') {
            const chunk = parseTextChunk(view, uint8, offset, length);
            if (chunk) chunks.push(chunk);
        } else if (type === 'iTXt') {
            const chunk = parseITXtChunk(view, uint8, offset, length);
            if (chunk) chunks.push(chunk);
        } else if (type === 'IEND') {
            break;
        }

        offset += 12 + length; // Length(4) + Type(4) + Data(length) + CRC(4)
    }

    return determinePromptFormat(chunks);
}

function parseTextChunk(view: DataView, uint8: Uint8Array, offset: number, length: number) {
    if (offset + 8 + length > view.byteLength) return null;
    
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    let nullIndex = -1;
    
    for (let i = dataStart; i < dataEnd; i++) {
        if (uint8[i] === 0) {
            nullIndex = i;
            break;
        }
    }
    
    if (nullIndex !== -1) {
        const keyword = getAsciiString(uint8, dataStart, nullIndex - dataStart);
        const text = new TextDecoder().decode(uint8.subarray(nullIndex + 1, dataEnd));
        return { keyword, text };
    }
    return null;
}

function parseITXtChunk(view: DataView, uint8: Uint8Array, offset: number, length: number) {
    if (offset + 8 + length > view.byteLength) return null;
    
    const dataStart = offset + 8;
    let p = dataStart;
    
    // Keyword
    while(p < offset + 8 + length && uint8[p] !== 0) p++;
    const keyword = new TextDecoder().decode(uint8.subarray(dataStart, p));
    p++; // skip null
    
    if (p >= offset + 8 + length) return null;

    const compFlag = uint8[p];
    p += 2; // skip flag and method
    
    // LangTag
    while(p < offset + 8 + length && uint8[p] !== 0) p++;
    p++; // skip null
    
    // TransKeyword
    while(p < offset + 8 + length && uint8[p] !== 0) p++;
    p++; // skip null
    
    if (p < offset + 8 + length) {
        const textBytes = uint8.subarray(p, offset + 8 + length);
        if (compFlag === 0) {
            const text = new TextDecoder().decode(textBytes);
            return { keyword, text };
        }
        // TODO: Handle compressed text (zlib) if needed
    }
    return null;
}

function determinePromptFormat(chunks: { keyword: string, text: string }[]): EmbeddedPrompt | null {
    // Priority: parameters (A1111), civitai, prompt (ComfyUI), workflow (ComfyUI)
    
    const params = chunks.find(c => c.keyword === 'parameters');
    if (params) {
        return parseA1111(params.text, params.keyword);
    }

    const civitai = chunks.find(c => c.keyword.toLowerCase() === 'civitai');
    if (civitai) {
        return parseCivitai(civitai.text);
    }

    const prompt = chunks.find(c => c.keyword === 'prompt');
    const workflow = chunks.find(c => c.keyword === 'workflow');
    if (prompt || workflow) {
        return parseComfy(prompt?.text, workflow?.text);
    }

    return null;
}

function extractJpeg(view: DataView, uint8: Uint8Array) {
    let offset = 2;
    while (offset < view.byteLength) {
        if (offset + 4 > view.byteLength) break;
        const marker = view.getUint16(offset);
        
        if (marker === 0xFFDA) break; // SOS
        
        // Handle markers that don't have length (RSTn, SOI, EOI - though SOI handled, EOI at end)
        // 0xFF00 - 0xFFFF.
        // RSTn are 0xFFD0 - 0xFFD7. No length.
        if (marker >= 0xFFD0 && marker <= 0xFFD7) {
            offset += 2;
            continue;
        }

        const length = view.getUint16(offset + 2);
        
        if (marker === 0xFFFE) { // COM (Comment)
            const text = new TextDecoder().decode(uint8.subarray(offset + 4, offset + 2 + length));
            const result = tryParseComment(text, 'COM');
            if (result) return result;
        }
        
        // APP1 (Exif) - 0xFFE1
        if (marker === 0xFFE1) {
             const exifHeader = getAsciiString(uint8, offset + 4, 6);
             if (exifHeader === "Exif\0\0") {
                 // Parse Exif for UserComment (0x9286)
                 const tiffStart = offset + 10;
                 const userComment = extractExifUserComment(view, tiffStart);
                 if (userComment) {
                     const result = tryParseComment(userComment, 'Exif');
                     if (result) return result;
                 }
             }
        }

        offset += 2 + length;
    }
    return null;
}

function tryParseComment(text: string, source: string) {
    // Try to detect format
    if (text.trim().startsWith('{')) {
        try {
            const json = JSON.parse(text);
            if (json.prompt || json.negativePrompt) return parseCivitai(text);
            if (json.nodes || json.workflow) return parseComfy(text);
            if (looksLikeApiPrompt(json)) return parseComfy(text);
            if (json.sui_image_params) return parseSuiParams(json, text);
        } catch(e) {}
    }
    // Fallback to A1111
    return parseA1111(text, source);
}

function extractExifUserComment(view: DataView, tiffStart: number): string | null {
    try {
        const byteOrder = view.getUint16(tiffStart);
        const isLittleEndian = byteOrder === 0x4949;
        
        const firstIfdOffset = view.getUint32(tiffStart + 4, isLittleEndian);
        if (firstIfdOffset < 8) return null;

        const ifdOffset = tiffStart + firstIfdOffset;
        
        // Search for ExifOffset (0x8769) in IFD0
        const exifSubIfdOffset = findTagValue(view, ifdOffset, 0x8769, isLittleEndian);

        if (exifSubIfdOffset && exifSubIfdOffset > 0) {
            const exifIfdOffset = tiffStart + exifSubIfdOffset;
            
            // Search for UserComment (0x9286)
            const userCommentEntry = findTagEntry(view, exifIfdOffset, 0x9286, isLittleEndian);
            
            if (userCommentEntry) {
                const count = view.getUint32(userCommentEntry + 4, isLittleEndian);
                const valueOffset = view.getUint32(userCommentEntry + 8, isLittleEndian);
                
                return decodeUserComment(view, tiffStart, valueOffset, count, isLittleEndian);
            }
        }
    } catch (e) {
        // console.error("Exif parse error", e);
    }
    return null;
}

function findTagEntry(view: DataView, ifdOffset: number, targetTag: number, isLittleEndian: boolean): number | null {
    const numEntries = view.getUint16(ifdOffset, isLittleEndian);
    for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdOffset + 2 + (i * 12);
        const tag = view.getUint16(entryOffset, isLittleEndian);
        if (tag === targetTag) {
            return entryOffset;
        }
    }
    return null;
}

function findTagValue(view: DataView, ifdOffset: number, targetTag: number, isLittleEndian: boolean): number | null {
    const entryOffset = findTagEntry(view, ifdOffset, targetTag, isLittleEndian);
    if (entryOffset) {
        return view.getUint32(entryOffset + 8, isLittleEndian);
    }
    return null;
}

function decodeUserComment(view: DataView, tiffStart: number, valueOffset: number, count: number, isLittleEndian: boolean): string {
    // Value is at tiffStart + valueOffset
    // First 8 bytes are encoding
    const encoding = getAsciiString(new Uint8Array(view.buffer), tiffStart + valueOffset, 8);
    const dataStart = tiffStart + valueOffset + 8;
    const dataLen = count - 8;
    
    if (encoding.startsWith('UNICODE')) {
        // UTF-16 (endianness varies by writer - sniff it)
        const textBytes = new Uint8Array(view.buffer).subarray(dataStart, dataStart + dataLen);
        return decodeUtf16EitherEndianness(textBytes);
    } else if (encoding.startsWith('ASCII')) {
        const textBytes = new Uint8Array(view.buffer).subarray(dataStart, dataStart + dataLen);
        return new TextDecoder('ascii').decode(textBytes).replace(/\0/g, '');
    } else {
        // Try default decode
        const textBytes = new Uint8Array(view.buffer).subarray(dataStart, dataStart + dataLen);
        return new TextDecoder().decode(textBytes).replace(/\0/g, '');
    }
}

function getAsciiString(uint8: Uint8Array, offset: number, length: number) {
    let str = '';
    for (let i = 0; i < length; i++) {
        str += String.fromCharCode(uint8[offset + i]);
    }
    return str;
}

function splitTags(text: string): string[] {
    // Prompts use commas; some writers use double spaces as separators too.
    return text
        .split(',')
        .flatMap(part => part.split(/\s{2,}/))
        .map(part => part.trim())
        .filter(part => part.length > 0);
}

/**
 * EXIF UserComment "UNICODE" text is UTF-16, but writers disagree on
 * endianness (often big-endian even inside little-endian TIFF). Decode both
 * ways and keep whichever reads like text.
 */
function decodeUtf16EitherEndianness(bytes: Uint8Array): string {
    const le = new TextDecoder('utf-16le').decode(bytes);
    const be = new TextDecoder('utf-16be').decode(bytes);
    return (printableRatio(le) >= printableRatio(be) ? le : be).replace(/\0/g, '');
}

function printableRatio(text: string): number {
    if (text.length === 0) return 0;
    let printable = 0;
    for (const ch of text) {
        const c = ch.codePointAt(0)!;
        if (c === 9 || c === 10 || (c >= 32 && c < 127)) printable++;
    }
    return printable / text.length;
}

/** True for ComfyUI API-format prompt maps: { "id": { class_type, inputs } } */
function looksLikeApiPrompt(json: any): boolean {
    if (!json || typeof json !== 'object') return false;
    let hits = 0;
    for (const key in json) {
        const node = json[key];
        if (node && typeof node === 'object' && typeof node.class_type === 'string') hits++;
        if (hits >= 2) return true;
    }
    return false;
}

/**
 * Stable Diffusion.cpp / SD.Next style: { "sui_image_params": { prompt, negativeprompt, ... } }
 */
function parseSuiParams(json: any, rawText: string): EmbeddedPrompt {
    const p = json.sui_image_params || json;
    const meta: string[] = [];
    for (const [k, v] of Object.entries(p)) {
        if (k === 'prompt' || k === 'negativeprompt' || k === 'negative_prompt') continue;
        if (typeof v === 'string' || typeof v === 'number') {
            meta.push(`${k}: ${v}`);
            if (meta.length >= 10) break;
        }
    }
    return {
        source: 'sui',
        positive: splitTags(p.prompt || ''),
        negative: splitTags(p.negativeprompt || p.negative_prompt || ''),
        metadata: meta,
        raw: rawText
    };
}

/** Collect generation settings (sampler, size, model, loras) from API-format nodes. */
function collectComfyMetadata(nodes: Record<string, any>, meta: Set<string>) {
    for (const key in nodes) {
        const node = nodes[key];
        if (!node || typeof node !== 'object' || !node.inputs) continue;
        const ct = node.class_type || '';
        const inp = node.inputs;

        if (ct === 'KSampler' || ct === 'KSamplerAdvanced' || ct === 'SamplerCustom') {
            if (inp.steps != null) meta.add(`Steps: ${inp.steps}`);
            if (inp.sampler_name) meta.add(`Sampler: ${inp.sampler_name}`);
            if (inp.scheduler) meta.add(`Scheduler: ${inp.scheduler}`);
            if (inp.cfg != null) meta.add(`CFG Scale: ${inp.cfg}`);
            if (inp.seed != null) meta.add(`Seed: ${inp.seed}`);
            if (ct === 'KSampler' && inp.denoise != null) meta.add(`Denoise: ${inp.denoise}`);
        } else if (ct === 'EmptyLatentImage' || ct === 'ImageScale' || ct === 'ImageScaleBy') {
            if (inp.width && inp.height) meta.add(`Size: ${inp.width}x${inp.height}`);
        } else if (ct === 'CheckpointLoaderSimple') {
            if (inp.ckpt_name) meta.add(`Model: ${friendlyResourceName(inp.ckpt_name)}`);
        } else if (ct === 'LoraLoader' || ct === 'LoraLoaderModelOnly') {
            if (inp.lora_name) {
                const strength = inp.strength_model ?? inp.weight ?? 1;
                meta.add(`Lora: ${friendlyResourceName(inp.lora_name)} (${strength})`);
            }
        }
    }
}

/** Shorten long resource URNs (urn:air:sdxl:lora:civitai:ID@VER -> civitai:ID) */
function friendlyResourceName(name: string): string {
    if (name.startsWith('urn:')) {
        const tail = name.split(':').slice(-2).join(':');
        return tail.split('@')[0];
    }
    return name;
}

function parseA1111(text: string, name: string): EmbeddedPrompt {
    // Some writers (SD.Next / stable-diffusion.cpp) embed JSON in "parameters".
    if (text.trim().startsWith('{')) {
        try {
            const json = JSON.parse(text);
            if (json.sui_image_params || json.prompt) {
                return parseSuiParams(json, text);
            }
        } catch(e) {}
    }

    // Remove newlines for regex matching if needed, but A1111 usually relies on them.
    const cleanText = text.replace(/(\r\n|\n|\r)/gm, " ");
    
    // Check if we can find the delimiters we expect
    const hasNegative = cleanText.includes("Negative prompt:");
    const hasSteps = cleanText.includes("Steps:");

    // If we don't find typical A1111 delimiters, return empty parsed prompt
    // This prevents random text from being treated as a prompt
    if (!hasNegative && !hasSteps) {
        return {
            source: 'unknown',
            positive: [],
            negative: [],
            metadata: [],
            raw: text
        };
    }

    const promptParts = cleanText.split(/.(?=Negative prompt:)|.(?=Steps:)/);
    
    const posPrompt = promptParts[0]
        ? promptParts[0].split(",").map(s => s.trim()).filter(s => s)
        : [];
        
    const negPrompt = promptParts[1]
        ? promptParts[1].replace("Negative prompt:", "").split(",").map(s => s.trim()).filter(s => s)
        : [];
        
    const metaPrompt = promptParts[2]
        ? promptParts[2].split(",").map(s => s.trim()).filter(s => s)
        : [];
    
    return {
        source: 'a1111',
        positive: posPrompt,
        negative: negPrompt,
        metadata: metaPrompt,
        raw: text
    };
}

function parseCivitai(text: string): EmbeddedPrompt {
    try {
        const json = JSON.parse(text);
        const pos = json.prompt ? json.prompt.split(",").map((s: string) => s.trim()) : [];
        const neg = json.negativePrompt ? json.negativePrompt.split(",").map((s: string) => s.trim()) : [];
        
        // Meta from parameters
        const meta: string[] = [];
        if (json.parameters) {
            for (const [key, value] of Object.entries(json.parameters)) {
                meta.push(`${key}: ${value}`);
            }
        }
        
        return {
            source: 'civitai',
            positive: pos,
            negative: neg,
            metadata: meta,
            raw: text
        };
    } catch (e) {
        return {
            source: 'civitai',
            positive: [],
            negative: [],
            metadata: [],
            raw: text
        };
    }
}

function parseComfy(promptJson?: string, workflowJson?: string): EmbeddedPrompt {
    let pos: string[] = [];
    let neg: string[] = [];
    let meta: string[] = [];
    let raw = "";

    if (promptJson) {
        raw += promptJson;
        try {
            const json = JSON.parse(promptJson);
            // Handle "nodes" wrapper if present (from user example)
            const nodes = json.nodes || json;

            // First, try to find prompts via KSampler references (most reliable)
            const foundViaSampler = processComfyViaSampler(nodes, pos, neg);

            // If we didn't find prompts via sampler, fall back to heuristic approach
            if (!foundViaSampler) {
                for (const key in nodes) {
                    processComfyNodeHeuristic(nodes[key], pos, neg);
                }
            }

            // Generation settings (sampler params, size, model, loras)
            const metaSet = new Set<string>();
            collectComfyMetadata(nodes, metaSet);
            for (const m of metaSet) {
                if (meta.length < 12) meta.push(m);
            }
        } catch (e) {
            // console.error("Comfy parse error", e);
        }
    }
    
    if (workflowJson) {
        if (raw) raw += "\n\nWorkflow:\n";
        raw += workflowJson;
    }

    return {
        source: 'comfyui',
        positive: pos,
        negative: neg,
        metadata: meta,
        raw: raw
    };
}

/**
 * Extract prompts by following KSampler's positive/negative input references.
 * This is the most reliable method as it uses the actual workflow connections.
 * Returns true if prompts were found via this method.
 */
function processComfyViaSampler(nodes: Record<string, any>, pos: string[], neg: string[]): boolean {
    // Find sampler nodes (KSampler, KSamplerAdvanced, etc.)
    const samplerTypes = ['KSampler', 'KSamplerAdvanced', 'SamplerCustom'];
    
    for (const key in nodes) {
        const node = nodes[key];
        if (node.class_type && samplerTypes.some(t => node.class_type.includes(t))) {
            const inputs = node.inputs;
            if (inputs) {
                // Extract positive prompt reference
                const positiveRef = inputs.positive;
                if (positiveRef && Array.isArray(positiveRef) && positiveRef.length >= 1) {
                    const positiveNodeId = String(positiveRef[0]);
                    const positiveNode = nodes[positiveNodeId];
                    if (positiveNode) {
                        const text = extractTextFromNode(positiveNode);
                        if (text) {
                            pos.push(...splitTags(text));
                        }
                    }
                }
                
                // Extract negative prompt reference
                const negativeRef = inputs.negative;
                if (negativeRef && Array.isArray(negativeRef) && negativeRef.length >= 1) {
                    const negativeNodeId = String(negativeRef[0]);
                    const negativeNode = nodes[negativeNodeId];
                    if (negativeNode) {
                        const text = extractTextFromNode(negativeNode);
                        if (text) {
                            neg.push(...splitTags(text));
                        }
                    }
                }
                
                // If we found at least one prompt via sampler, return true
                if (pos.length > 0 || neg.length > 0) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

/**
 * Extract text from a node, handling various node types and input field names.
 */
function extractTextFromNode(node: any): string | null {
    const inputs = node.inputs;
    if (!inputs) return null;
    
    // CLIPTextEncode and variants use 'text'
    // CLIPTextEncodeSDXL uses 'text_g' and 'text_l' for different pools
    // smZ CLIPTextEncode may use different field names
    
    // Try common text field names in order of preference
    const textFields = ['text', 'text_g', 'text_l'];
    
    for (const field of textFields) {
        if (inputs[field] && typeof inputs[field] === 'string' && inputs[field].trim()) {
            return inputs[field].trim();
        }
    }
    
    return null;
}

/**
 * Fallback heuristic approach - tries to identify positive/negative based on node title.
 * Used when KSampler references aren't available or don't lead to prompt nodes.
 */
function processComfyNodeHeuristic(node: any, pos: string[], neg: string[]) {
    // Look for CLIPTextEncode
    if (node.class_type && (node.class_type === 'CLIPTextEncode' || node.class_type === 'smZ CLIPTextEncode')) {
        const text = extractTextFromNode(node);
        if (text) {
            // Check metadata for title
            const title = node._meta?.title?.toLowerCase();
            if (title && title.includes('negative')) {
                neg.push(...splitTags(text));
            } else {
                // Default to positive (explicit "positive" titles and unknown both go here)
                pos.push(...splitTags(text));
            }
        }
    }
}
