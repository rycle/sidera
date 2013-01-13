define(function(require) {

    var provider;

    function isCursorOver(bounds) {
        return(state.x >= bounds.left) && (state.x <= bounds.right) && (state.y >= bounds.top) && (state.y <= bounds.bottom);
    }

    if(window.navigator.msPointerEnabled) {
        // IE10 support
        provider = require('input/providers/pointers');
    } else {
        provider = require('input/providers/touch');
    }

    // We expect that `update` will only be called once per
    // iteration of the game's main loop.
    return {
        state: {},
        listen: provider.listen.bind(provider),
        update: function() {

            var interalState = provider.getState();
            var i;
            var pointer;

            var exportedState = {
                x: interalState.x,
                y: interalState.y,
                hasPointer: interalState.hasPointer,
                pointers: []
            };

            for(i = interalState.pointers.length - 1; i >= 0; i--) {
                pointer = interalState.pointers[i];

                exportedState.pointers.push({
                    x: pointer.x,
                    y: pointer.y,
                    id: pointer.id
                });
            }

            this.state = exportedState;
        }
    };

});