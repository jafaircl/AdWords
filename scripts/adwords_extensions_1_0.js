/*
 * Ad Extension Checker
 * ---
 * @param {string} extImpressionThreshold - Minimum impressions needed to confirm an extension is on
 * @param {string} extDateRange - Date range to use for checking impressions
 */

function checkAdExtensions() {
  var calloutIterator = AdWordsApp.extensions()
      .callouts()
      .withCondition('Status = ENABLED')
      .withCondition(extImpressionThreshold)
      .forDateRange(extDateRange)
      .get();
  
  var phoneNumberIterator = AdWordsApp.extensions()
      .phoneNumbers()
      .withCondition('Status = ENABLED')
      .withCondition(extImpressionThreshold)
      .forDateRange(extDateRange)
      .get();
  
  var reviewIterator = AdWordsApp.extensions()
      .reviews()
      .withCondition('Status = ENABLED')
      .withCondition(extImpressionThreshold)
      .forDateRange(extDateRange)
      .get();
  
  var sitelinkIterator = AdWordsApp.extensions()
      .sitelinks() 
      .withCondition('Status = ENABLED')
      .withCondition(extImpressionThreshold)
      .forDateRange(extDateRange)
      .get();
  
  
  if (calloutIterator.hasNext()){
    sendEmail = true;
    emailBody += '<h3>Callout Extensions with ' + extImpressionThreshold + ' from ' + extDateRange + ':</h3>';
  }
  while (calloutIterator.hasNext()) {
    var callout = calloutIterator.next().getText();
    emailBody += '<li>' + callout + '</li>';
    Logger.log(callout);
  }
  
  if (phoneNumberIterator.hasNext()){
    sendEmail = true;
    emailBody += '<h3>Call Extensions with ' + extImpressionThreshold + ' from ' + extDateRange + ':</h3>';
  }
  while (phoneNumberIterator.hasNext()) {
    var phoneNumber = phoneNumberIterator.next().getPhoneNumber();
    emailBody += '<li>' + phoneNumber + '</li>';
    Logger.log(phoneNumber);
  }
  
  if (reviewIterator.hasNext()){
    sendEmail = true;
    emailBody += '<h3>Review Extensions with ' + extImpressionThreshold + ' from ' + extDateRange + ':</h3>';
  }
  while (reviewIterator.hasNext()) {
    var review = reviewIterator.next().getText();
    emailBody += '<li>' + review + '</li>';
    Logger.log(review);
  }
  
  if (sitelinkIterator.hasNext()){
    sendEmail = true;
    emailBody += '<h3>Sitelink Extensions with ' + extImpressionThreshold + ' from ' + extDateRange + ':</h3>';
  }
  while (sitelinkIterator.hasNext()) {
    var sitelink = sitelinkIterator.next().getLinkText();
    emailBody += '<li>' + sitelink + '</li>';
    Logger.log(sitelink);
  }
}