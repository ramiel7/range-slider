$(document).ready(function() {
    // Define slider limits
    var sliderMin = 0;
    var sliderMax = 1000;

    // State: current effective values for min and max used by the slider
    var currentMin = sliderMin;
    var currentMax = sliderMax;

    // Store the raw value typed by the user for the max input.
    // This may be lower than currentMin.
    var rawMaxInput = sliderMax;

    // Cache slider elements
    var $slider = $('.range-slider');
    var $rangeBar = $('.slider-range');
    var $handleMin = $('.handle-min');
    var $handleMax = $('.handle-max');

    // Variables for slider dimensions
    var sliderOffset = 0;
    var sliderWidth = 0;

    // Active handle (if dragging)
    var activeHandle = null;

    // Update slider dimensions (offset and width)
    function updateSliderDimensions() {
      sliderOffset = $slider.offset().left;
      sliderWidth = $slider.width();
    }

    // Convert a value to a percentage position on the slider
    function valueToPercent(val) {
      return ((val - sliderMin) / (sliderMax - sliderMin)) * 100;
    }

    // Convert a pixel position (relative to slider) to a value 
    function positionToValue(pos) {
      return Math.round((pos / sliderWidth) * (sliderMax - sliderMin) + sliderMin);
    }

    // Update the slider's positions (handles and colored range bar) from the state.
    // For the max handle, we calculate an effective max value which is never below currentMin.
    function updateSliderFromState() {
      updateSliderDimensions();
      // Calculate effective max: if rawMaxInput is below currentMin, we use currentMin for slider position.
      var effectiveMax = Math.max(currentMin, Math.min(rawMaxInput, sliderMax));
      currentMax = effectiveMax;

      var minPercent = valueToPercent(currentMin);
      var maxPercent = valueToPercent(effectiveMax);

      // Update handles positions
      $handleMin.css('left', minPercent + '%');
      $handleMax.css('left', maxPercent + '%');

      // Update the colored range bar between the handles
      $rangeBar.css({
        left: minPercent + '%',
        width: (maxPercent - minPercent) + '%'
      });

      // Update input fields.
      // For min input, always update from currentMin.
      $('#min-input').val(currentMin);
      // For max input, if the user is not currently editing (not focused),
      // update the displayed value to the raw input.
      if (!$('#max-input').is(':focus')) {
        $('#max-input').val(rawMaxInput);
      }
    }

    // Validate and update min input.
    $('#min-input').on('input', function() {
      var minStr = $(this).val();
      if (minStr === "") return;
      var newMin = parseInt(minStr, 10);
      if (isNaN(newMin)) newMin = sliderMin;

      // Clamp newMin to never go below 0 or above sliderMax.
      newMin = Math.max(sliderMin, Math.min(newMin, sliderMax));

      // If the new minimum is greater than the raw max input, 
      // we update rawMaxInput so that when focus is lost the slider shows a valid range.
      if (newMin > rawMaxInput) {
        rawMaxInput = newMin;
      }
      currentMin = newMin;
      updateSliderFromState();
    });

    // Validate and update max input.
    // This handler allows the user to type a number lower than the current min.
    $('#max-input').on('input', function() {
      var maxStr = $(this).val();
      if (maxStr === "") return;
      var typedMax = parseInt(maxStr, 10);
      if (isNaN(typedMax)) typedMax = sliderMax;

      // Ensure the typed max is not below 0.
      typedMax = Math.max(0, typedMax);

      // Store the raw value typed by the user.
      rawMaxInput = typedMax;

      // For the slider's effective max value, we make sure it is never below currentMin.
      currentMax = Math.max(currentMin, Math.min(rawMaxInput, sliderMax));

      updateSliderFromState();
    });

    // When dragging, update state based on handle movement.
    function moveHandle(e) {
      if (!activeHandle) return;
      e.preventDefault();

      // Get the current x-coordinate (supports touch and mouse).
      var clientX = e.type.startsWith('touch')
        ? e.originalEvent.touches[0].clientX
        : e.clientX;

      updateSliderDimensions();

      // Calculate the new left position relative to slider (in pixels) and clamp it.
      var newLeft = clientX - sliderOffset;
      newLeft = Math.max(0, Math.min(newLeft, sliderWidth));

      // Convert to value.
      var newValue = positionToValue(newLeft);

      // Determine which handle is being dragged.
      var type = $(activeHandle).data('type');
      if (type === 'min') {
        // For the min handle, ensure it does not exceed the effective current max.
        currentMin = Math.min(newValue, currentMax);
        // Also, if currentMin becomes greater than the raw max value,
        // update rawMaxInput so that later the user sees a consistent value.
        if (rawMaxInput < currentMin) {
          rawMaxInput = currentMin;
        }
      } else {
        // For the max handle, ensure it does not go below currentMin.
        // Note: Even if the user typed a lower number, the slider handle stays at currentMin.
        currentMax = Math.max(newValue, currentMin);
        // Also update rawMaxInput to reflect slider movement.
        rawMaxInput = currentMax;
      }
      updateSliderFromState();
    }

    // End dragging and remove event listeners.
    function stopDragging() {
      activeHandle = null;
      $(document).off('mousemove touchmove', moveHandle);
      $(document).off('mouseup touchend', stopDragging);
    }

    // Start dragging when the user presses down on a handle (mouse or touch).
    $('.slider-handle').on('mousedown touchstart', function(e) {
      activeHandle = this;
      updateSliderDimensions();
      $(document).on('mousemove touchmove', moveHandle);
      $(document).on('mouseup touchend', stopDragging);
      e.preventDefault();
    });

    // When the max input loses focus, update its display value to the effective slider value.
    $('#max-input').on('blur', function() {
      // When editing ends, force the input to show the effective value.
      $(this).val(currentMax);
      // Also update rawMaxInput to reflect the slider's effective max.
      rawMaxInput = currentMax;
    });

    // Update slider on window resize.
    $(window).on('resize', function() {
      updateSliderDimensions();
      updateSliderFromState();
    });

    // Initialize slider positions on page load.
    updateSliderFromState();
  });
