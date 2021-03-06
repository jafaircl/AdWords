/*
 * Global Variables
 */
// Email address to send reports
var recipientEmail = 'example@example.com';

/*
 * A/B Ad Testing
 */
var adTesting = 1,

  // @param {string} Minimum impressions or skip ad group e.g. 'Impressions > 50'
  abImpressionThreshold = 'Impressions > 100',

  // @param {string} Testing time period e.g. 'ALL_TIME' or 'LAST_30_DAYS'
  abTimePeriod = 'ALL_TIME',

  // @param {string} Text in name of campaigns to skip e.g. 'Display'
  abExcludedCampaigns = 'display',

  // @param {number} Minimum # of conversions necessary before using conversion 
  // rate as the test. Set to a very high number to always use clicks
  abConversionThreshold = 2,

  // @param {number} Threshold of caring. Any loss below this number is acceptable.
  abAcceptableLoss = 0.002;

/*
 * Watson Keyword Miner
 */
var watsonKeywordMiner = 1;

// Private Variables
var sendEmail = false,
    emailBody = '',
    accountName = AdWordsApp.currentAccount().getName();

/*
 * Main Function
 */
function main(){
  
  if (adTesting == 1) {
    var code = getCode('https://raw.githubusercontent.com/jafaircl/AdWords/master/scripts/adwords_bayes_1_0.js');
    eval(code);
    bayesAdGroupIterator(abImpressionThreshold, abTimePeriod, abExcludedCampaigns);
  }
  
  if (watsonKeywordMiner == 1) {
    var code = getCode('https://raw.githubusercontent.com/jafaircl/AdWords/master/scripts/adwords_watson_1_0.js');
    eval(code);
    watsonKeywords();
  }
  
  // Send an email alert if anything triggered it.
  if (sendEmail == true) {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: 'Results For ' + accountName,
      htmlBody: emailBody
    });
  }
}

/*
 * Run External JavaScript
 * ---
 * @param {string} url - The URL of the external JavaScript file.
 */
function getCode(url){
  var stuff = UrlFetchApp.fetch(url).getContentText();
  return stuff;
}

/*
 * Delete Labels From An Account
 * ---
 * @param {string} contains - A unique text string for all the labesl to delete.
 */
function deleteLabels(contains) {
  
  var labelIterator = AdWordsApp.labels()
      .withCondition('LabelName CONTAINS "' + contains + '"')
      .get();
  while (labelIterator.hasNext()) {
    var labelName = labelIterator.next();
    labelName.remove();
  }
}

/*
 * Add Labels To An Account
 * ---
 * @param {string} labelName - A name for the label
 * @param {string} labelColor - A hex color for the label.
 */
function checkForLabels(labelName, labelColor) {
  
  var labelIterator = AdWordsApp.labels()
      .withCondition('Name = "' + labelName + '"')
      .get();
  if (!labelIterator.hasNext()) {
    AdWordsApp.createLabel(labelName, '', labelColor);
  }
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};