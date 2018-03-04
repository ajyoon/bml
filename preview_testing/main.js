$('#bml-input').keyup(function (event) {
  var highlightedHtml = bmlHighlighting.highlightBml($(this).val());
  $('#bml-highlighted').html(highlightedHtml);

  var renderedBml = bml($(this).val());
  $('#bml-preview').html(renderedBml);
});
