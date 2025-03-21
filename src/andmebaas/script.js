$(function () {
    if ($('#filter_all').prop) {
        $('#filter_all').prop('checked', true);
    } else {
        // Fallback for older browsers
        $('#filter_all').attr('checked', 'checked');
    }
})
