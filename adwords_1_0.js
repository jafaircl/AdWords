
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
  var testingLabel = 'Test In Progress';

function main(){
  if (adTesting == 1) {
    // Include the script
    includeExternalJS('https://cdnjs.cloudflare.com/ajax/libs/jstat/1.5.3/jstat.min.js');
    bayesAdGroupIterator(impressionThreshold, timePeriod, excludedCampaigns);
  }
}

/*
 * Include External JavaScript Libraries
 * ---
 * @param {string} url - The URL of the external JavaScript file.
 */
function includeExternalJS(url){
  eval(UrlFetchApp.fetch(url).getContentText());
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