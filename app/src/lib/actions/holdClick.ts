export function holdClick(node: HTMLElement, { holdTime = 1000, onHold , onClick } = {}) {
    let pressTimer: ReturnType<typeof setTimeout> | null = null
    let isHoldTriggered = false;

    console.log('holdClick action attached to:', node); // Debug line

    function handlePointerDown (event: PointerEvent) {
        isHoldTriggered = false;
        pressTimer = setTimeout(() => {
            isHoldTriggered = true;
            onHold?.(event);
        }, holdTime);
    }

    function handlePointerUp(event: PointerEvent) {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        
        if (!isHoldTriggered) {
            onClick?.(event);
        }
    }
        
    function handlePointerLeave() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }

    function handleClick(event: Event) {
        if(isHoldTriggered){
            event?.preventDefault()
            event?.stopPropagation();
        }

        isHoldTriggered = false;
    }

    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointerup', handlePointerUp);
    node.addEventListener('pointerleave', handlePointerLeave);
    node.addEventListener('click', handleClick, { capture: true });

     return {
        destroy() {
            node.removeEventListener('pointerdown', handlePointerDown);
            node.removeEventListener('pointerup', handlePointerUp);
            node.removeEventListener('pointerleave', handlePointerLeave);
            node.removeEventListener('click', handleClick, { capture: true });
        }
    };

}
