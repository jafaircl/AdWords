var bayesSendEmail = 0;
var abWinnerLabel = 'Winner';
var abLoserLabel = 'Loser';
/*
 * Bayesian Ad Testing Function
 * ---
 * @param {string} impressionThreshold - Minimum impressions or skip ad group e.g. 'Impressions > 50'
 * @param {string} timePeriod - Testing time period e.g. 'ALL_TIME' or 'LAST_30_DAYS'
 * @param {string} excludedCampaigns - Text in name of campaigns to skip e.g. 'Display'
 */
function bayesAdGroupIterator(impressionThreshold, timePeriod, excludedCampaigns) {
  
  // Remove the percentage labels
  deleteLabels('Probability');
  deleteLabels('Odds To Win');
  
  // Create the winner and loser labels if they don't already exist
  checkForLabels(abWinnerLabel, '#1B9AAA');
  checkForLabels(abLoserLabel, '#EF476F');
  
  // Include jStat
  var code = getCode('https://cdnjs.cloudflare.com/ajax/libs/jstat/1.5.3/jstat.min.js');
  eval(code);
  
  var adGroupIterator = AdWordsApp.adGroups()
      .withCondition('CampaignStatus = ENABLED')
      .withCondition('Status = ENABLED')
      .withCondition('CampaignName DOES_NOT_CONTAIN_IGNORE_CASE "' + excludedCampaigns + '"')
      .withCondition(impressionThreshold)
      .forDateRange(timePeriod)
      .get();
  
  while ( adGroupIterator.hasNext() ) {
    var adGroup = adGroupIterator.next();
    var adGroupName = adGroup.getName();
    var adGroupId = adGroup.getId();
    var adGroupConversions = adGroup.getStatsFor(timePeriod).getConvertedClicks();
    
    bayesAdIterator('ALL', adGroup, impressionThreshold, timePeriod);
    bayesAdIterator('MOBILE', adGroup, impressionThreshold, timePeriod);
  }
  
  emailBody += '</ul>';
}

/*
 * Bayesian Ad Iterator
 * ---
 * @param {string} device - Iterate through the ads and do the tests
 */
function bayesAdIterator(device, adGroup, impressionThreshold, timePeriod) {
  
  var adIterator = adGroup.ads()
      .withCondition('Status = ENABLED')
      .withCondition('Type = TEXT_AD')
      .withCondition('DevicePreferenceType = ' + device)
      .withCondition(impressionThreshold)
      .forDateRange(timePeriod)
      .orderBy('Impressions DESC')
      .get();
  
  // Check to make sure there are only 2 ads
  if ( adIterator.totalNumEntities() > 1 ) {
    
    // Build an object to store the ads to be compared
    var adsObject = {};
    var i = 0;
    
    // Iterate through the ads
    while ( adIterator.hasNext() ) {
      var ad = adIterator.next();
      var adStats = ad.getStatsFor(timePeriod);
      
      // Remove the labels to avoid errors and confusion
      ad.removeLabel(abWinnerLabel);
      ad.removeLabel(abLoserLabel);
      
      // Set the object values for this ad
      adsObject[i] = {
        id: ad.getId(),
        adGroup: adGroup,
        adGroupName: adGroup.getName(),
        campaignName: adGroup.getCampaign().getName(),
        clicks: adStats.getClicks(),
        impressions: adStats.getImpressions(),
        conversions: adStats.getConvertedClicks()
      }
      i++;
    }
    
    // Test the ads
    bayesAdTester(adsObject);
  }
}

/*
 * Bayesian Ad Tester
 * ---
 * @param {object} adsObject - The object containing the ad information
 */
function bayesAdTester(adsObject){
  if ( adsObject[0].conversions >= abConversionThreshold 
      && adsObject[1].conversions >= abConversionThreshold ) {
    var adGroup = adsObject[0].adGroup;
    var alphaA = adsObject[0].conversions;
    var betaA = adsObject[0].impressions - adsObject[0].conversions;
    var alphaB = adsObject[1].conversions;
    var betaB = adsObject[1].impressions - adsObject[1].conversions;
  } else {
    var adGroup = adsObject[0].adGroup;
    var alphaA = adsObject[0].clicks;
    var betaA = adsObject[0].impressions - adsObject[0].clicks;
    var alphaB = adsObject[1].clicks;
    var betaB = adsObject[1].impressions - adsObject[1].clicks;
  }
  
  // Run the test
  var test = bayesTest(alphaA, betaA, alphaB, betaB);
  
  // Run the decision function
  var decision = bayesDecision(alphaA, betaA, alphaB, betaB);
  var formattedDecision = (100 * decision).toFixed(6);
  
  if ( decision < 0.002 ) {
    bayesSendEmail++;
    
    
    if ( bayesSendEmail == 1 ) {
      emailBody += '<h2>A/B Testing Results:</h2><ul>';
    }
    
    if ( test < 0.5 ) {
      adGroup.ads().withIds([adsObject[0].id]).get().next().applyLabel(abWinnerLabel);
      adGroup.ads().withIds([adsObject[1].id]).get().next().applyLabel(abLoserLabel);
      
      emailBody += '<br><li><strong>' + adsObject[0].campaignName + ' - ' + adsObject[0].adGroupName + '<br>';
      emailBody += 'There is a winner with ' + Math.round((1-test) * 100) + '% probability. Even if it is wrong, the expected loss is only ' + formattedDecision + '%.'
      emailBody += '</strong><br></li>';
      sendEmail = true;
      
    } else {
      adGroup.ads().withIds([adsObject[1].id]).get().next().applyLabel(abWinnerLabel);
      adGroup.ads().withIds([adsObject[0].id]).get().next().applyLabel(abLoserLabel);
      
      emailBody += '<br><li><strong>' + adsObject[0].campaignName + ' - ' + adsObject[0].adGroupName + '<br>';
      emailBody += 'There is a winner with ' + Math.round((test) * 100) + '% probability. Even if it is wrong, the expeced loss is only ' + formattedDecision + '%.'
      emailBody += '</strong><br></li>';
      sendEmail = true;
      
    }
  } else {
    if ( test < 0.5 ) {
      var bestAdLabelName = Math.round((1-test) * 100) + '% Probability';
      checkForLabels(bestAdLabelName, '#06D6A0');
      adGroup.ads().withIds([adsObject[0].id]).get().next().applyLabel(bestAdLabelName);
      
      var worstAdLabelName = Math.round((test) * 100) + '% Probability';
      checkForLabels(worstAdLabelName, '#FFC43D');
      adGroup.ads().withIds([adsObject[1].id]).get().next().applyLabel(worstAdLabelName);
      
      if ( test < 0.05 ) {
        bayesSendEmail++;
        if ( bayesSendEmail == 1 ) {
          emailBody += '<h2>A/B Testing Results:</h2><ul>';
        }
        emailBody += '<br><li>' + adsObject[0].campaignName + ' - ' + adsObject[0].adGroupName + '<br>';
        emailBody += 'There is a ' + Math.round((1-test) * 100) + '% probability one ad is better than the other.<br>';
        emailBody += 'If it is wrong, the potential loss is ' + formattedDecision + '%.';
        emailBody += '<br></li>';
      }
      
    } else {
      var bestAdLabelName = Math.round((1-test) * 100) + '% Probability';
      checkForLabels(bestAdLabelName, '#06D6A0');
      adGroup.ads().withIds([adsObject[1].id]).get().next().applyLabel(bestAdLabelName);
      
      var worstAdLabelName = Math.round((test) * 100) + '% Probability';
      checkForLabels(worstAdLabelName, '#FFC43D');
      adGroup.ads().withIds([adsObject[0].id]).get().next().applyLabel(worstAdLabelName);
      
      if ( test > 0.95 ) {
        bayesSendEmail++;
        if ( bayesSendEmail == 1 ) {
          emailBody += '<h2>A/B Testing Results:</h2><ul>';
        }
        emailBody += '<br><li>' + adsObject[0].campaignName + ' - ' + adsObject[0].adGroupName + '<br>';
        emailBody += 'There is a ' + Math.round(test * 100) + '% probability one ad is better than the other.<br>';
        emailBody += 'If it is wrong, the potential loss is ' + formattedDecision + '%.';
        emailBody += '<br></li>';
      }
    }
  }
}

/*
 * Bayesian A/B Testing
 * ---
 * @param {number} alphaA - The number of successes for A
 * @param {number} betaA - The number of failures for A
 * @param {number} alphaB - The number of successes for B
 * @param {number} betaB - The number of failures for B
 */
function bayesTest(alphaA, betaA, alphaB, betaB) {
  var test = 0;
  for (i = 0; i < alphaB; i++) {
    /*var numerator = jStat.betafn((alphaA + i), (betaA + betaB));
    var denominator = (betaB + i) - jStat.betafn((1 + i), betaB) - jStat.betafn(alphaA, betaA);
    test += numerator / denominator;*/
    test += Math.exp(jStat.betaln(alphaA+i, betaB+betaA) - Math.log(betaB+i) - jStat.betaln(1+i, betaB) - jStat.betaln(alphaA, betaA));
  }
  
  return test;
}

/*
 * Bayesian Decision Rules
 * ---
 * @param {number} alphaA - The number of successes for A
 * @param {number} betaA - The number of failures for A
 * @param {number} alphaB - The number of successes for B
 * @param {number} betaB - The number of failures for B
 */
function bayesDecision(alphaA, betaA, alphaB, betaB) {
  var h1 = 1 - bayesTest((alphaA + 1), betaA, alphaB, betaB);
  var h2 = 1 - bayesTest(alphaA, betaA, (alphaB + 1), betaB);
  var b1 = jStat.betafn((alphaA + 1), betaA) / jStat.betafn(alphaA, betaA);
  var b2 = jStat.betafn((alphaB + 1), betaB) / jStat.betafn(alphaB, betaB);
  var result = (b1 * h1) - (b2 * h2);
  
  return result;
}