function checkKeywords(){
  var keywordIterator = AdWordsApp.keywords()
      .withCondition('CampaignStatus = ENABLED')
      .withCondition('AdGroupStatus = ENABLED')
      .withCondition('Status = ENABLED')
      .get();
  var i = 0;
  var j = 0;
  
  while (keywordIterator.hasNext()) {
    var keyword = keywordIterator.next();
    var campaign = keyword.getCampaign();
    var campaignName = campaign.getName();
    var adGroup = keyword.getAdGroup();
    var adGroupName = adGroup.getName();
    var keywordText = keyword.getText();
    
    var keywordCpc = keyword.bidding().getCpc();
    var keywordFirstPageCpc = keyword.getFirstPageCpc();
    
    var keywordApprovalStatus = keyword.getApprovalStatus();
    
    // Check for disapproved keywords
    if (keywordApprovalStatus == 'DISAPPROVED') {
      if (i == 0) {
        emailBody += '<h3>Disapproved Keywords:</h3>';
      }
      i++;
      sendEmail = true;
      emailBody += '<li>' + keywordText + ' in ' + campaignName + '</li>';
    }
    
    // Check for keywords below first page CPC
    if (keywordFirstPageCpc > keywordCpc ) {
      if (j == 0) {
        emailBody += '<h3>Keywords Below First Page Bid:</h3>';
      }
      j++;
      sendEmail = true;
      emailBody += '<li>' + keywordText + ' in ' + campaignName + ' - Current: $' + keywordCpc + ' - First Page: $' + keywordFirstPageCpc + '</li>';
      //var firstPageBidRow = [campaignName, adGroupName, keywordText, keywordCpc, keywordFirstPageCpc];
      //firstPageBidCsv += '\n' + firstPageBidRow.join(',');
    }
  }
}

function checkAds() {
  var adIterator = AdWordsApp.ads()
      .withCondition('CampaignStatus = ENABLED')
      .withCondition('AdGroupStatus = ENABLED')
      .withCondition('Status = ENABLED')
      .get();
  var adUrlArray = [];
  var brokenUrlsArray = [];
  var i = 0;
  var j = 0;
  var k = 0;
  
  while (adIterator.hasNext()) {
    var ad = adIterator.next();
    var campaign = ad.getCampaign();
    var campaignName = campaign.getName();
    var adGroup = ad.getAdGroup();
    var adGroupName = adGroup.getName();
    
    var adApprovalStatus = ad.getApprovalStatus();
    var adId = ad.getId();
    
    var adUrl = ad.urls().getFinalUrl();
    
    if (adApprovalStatus == 'DISAPPROVED') {
      
      var adDisapprovalReasons = ad.getDisapprovalReasons();
      
      if (i == 0) {
        emailBody += '<h3>Disapproved Ads:</h3>';
      }
      i++;
      sendEmail = true;
      emailBody += '<li>' + adId + ' in ' + campaignName + ' - ' + adGroupName + ' (' + adDisapprovalReasons + ')</li>';
    }
    if (adApprovalStatus == 'UNCHECKED') {
      
      if (j == 0) {
        emailBody += '<h3>Ads Under Review:</h3>';
      }
      j++;
      sendEmail = true;
      emailBody += '<li>' + adId + ' in ' + campaignName + ' - ' + adGroupName + '</li>';
    }
    
    // Check to make sure URL isn't already in the array
    if ( adUrlArray.indexOf(adUrl) < 0 ) {
      try {
        var response = UrlFetchApp.fetch(adUrl);
        var responseCode = response.getResponseCode();
      }
      catch(e){
        // Add the URL to the Broken URLs array
        brokenUrlsArray.push(adUrl);
        
        if (k == 0) {
          emailBody += '<h3>Broken URLs in Ads:</h3>';
        }
        k++;
        sendEmail = true;
        emailBody += '<li>' + adUrl + ' in ' + campaignName + ' - ' + adGroupName + '</li>';
        Logger.log(adUrl + ' is broken');
      }
      
      // Push URL to array so it doesn't get checked again
      adUrlArray.push(adUrl);
    }
    
    // If the url is in the broken urls array, apply a label to the ad
    if ( brokenUrlsArray.indexOf(adUrl) > -1 ) {
      ad.applyLabel(brokenUrlLabelName);
    } else {
      ad.removeLabel(brokenUrlLabelName);
    }
  }
}