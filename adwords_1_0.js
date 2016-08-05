/*
 * A/B Ad Testing
 */
var adTesting = 1;

  // @param {string} Minimum impressions or skip ad group e.g. 'Impressions > 50'
  var impressionThreshold = 'Impressions > 100';

  // @param {string} Testing time period e.g. 'ALL_TIME' or 'LAST_30_DAYS'
  var timePeriod = 'ALL_TIME';

  // @param {string} Text in name of campaigns to skip e.g. 'Display'
  var excludedCampaigns = 'display';

  // @param {number} Minimum # of conversions necessary before using conversion 
  // rate as the test. Set to a very high number to always use clicks
  var conversionThreshold = 2;

  // @params {string} Label Names
  var winnerLabel = 'Winner';
  var loserLabel = 'Loser';


var sendEmail = false;
var emailBody = '';

function main(){
  if (adTesting == 1) {
    // Include the script
    var code = getCode('https://raw.githubusercontent.com/jafaircl/AdWords/master/scripts/adwords_bayes_1_0.js');
    eval(code);
    bayesAdGroupIterator(impressionThreshold, timePeriod, excludedCampaigns);
    
    if (sendEmail == true) {
      MailApp.sendEmail({
        to: 'jfaircloth@cocg.co',
        subject: 'Test',
        htmlBody: emailBody
      });
    }
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