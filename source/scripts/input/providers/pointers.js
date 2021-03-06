define(function() {

    var state = {
        x: -1,
        y: -1,
        pointers: [],
        hasPointer: false
    };

    function handle_down(evt) {
        state.pointers.push({
            x: evt.offsetX,
            y: evt.offsetY,
            id: evt.pointerId
        });

        if(evt.isPrimary) {
            state.x = evt.offsetX;
            state.y = evt.offsetY;
        }

        state.hasPointer = true;
    }

    function removePointer(pointerId) {
        var l = state.pointers.length;

        for(var i = l - 1; i >= 0; i--) {
            if(state.pointers[i].id === pointerId) {
                state.pointers.splice(i, 1);
                break;
            }
        }

        if(state.pointers.length === 0) {
            state.hasPointer = false;
        }
    }

    function handle_cancel(evt) {
        removePointer(evt.pointerId);
    }

    function handle_up(evt) {
        removePointer(evt.pointerId);
    }

    function handle_over(evt) {
        console.log(evt.pointerId + ' over canvas');
    }

    function handle_move(evt) {

        var l = state.pointers.length;
        var pointer;

        if(!state.hasPointer) return;

        for(var i = l - 1; i >= 0; i--) {
            pointer = state.pointers[i];
            if(pointer.id === evt.pointerId) {
                pointer.x = evt.offsetX;
                pointer.y = evt.offsetY;
                break;
            }
        }

        if(evt.isPrimary) {
            state.x = evt.offsetX;
            state.y = evt.offsetY;
        }
    }

    function getState() {
        return state;
    }

    function listen(target) {
        target.addEventListener('MSPointerDown', handle_down);
        target.addEventListener('MSPointerUp', handle_up);
        target.addEventListener('MSPointerCancel', handle_cancel);
        target.addEventListener('MSPointerOut', handle_cancel);
        target.addEventListener('MSPointerOver', handle_over);
        target.addEventListener('MSPointerMove', handle_move);
    }

    return {
        listen: listen,
        getState: getState
    };

});