function watsonKeywords() {
  var adGroupArray = getAdGroupNames();
  var searchQueries = searchQueryRawText();
  var keywordApiKey = 'a405ac664d683e030f12fafeda7d0bff13dda613';
  // You can obtain the credentials by following the steps here:
  // http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/alchemy-language/api/v1/#authentication
  var watson = new AlchemyLanguageAPI({
    "url": "https://gateway-a.watsonplatform.net/calls",
    "apikey": keywordApiKey
  });
  var resp = watson.TextGetRankedKeywords({ 
    text : searchQueries[0].term
  });
  // Sort the results by relevance
  resp.keywords.sort(function(a,b) {
    return b.relevance - a.relevance;
  });
  // Just print them out
  var i = 0;
  for(var i in resp.keywords) {
    var keyword = resp.keywords[i];
    var keywordText = keyword.text.toProperCase();
    var keywordRelevance = keyword.relevance;
    var keywordRelPercent = (keywordRelevance * 100).toFixed(2);
    
    if ( adGroupArray.indexOf(keywordText) < 0 ) {
      if (i == 0) {
        emailBody += '<table><tr><th colspan="2"><h3>Mined Keywords</h3></th></tr>';
        emailBody += '<tr><th>Keyword</th><th>Relevance</th></tr>';
      }
      
      sendEmail = true;
      emailBody += '<tr><td>' + keywordText + '</td><td>' + keywordRelPercent + '%</td></tr>';
    }
  }
  emailBody += '</table>';
  for (j = 1; j < Object.keys(searchQueries).length; j++) {
    if (!searchQueries.hasOwnProperty(j)) {
        //The current property is not a direct property of p
        continue;
    }
    if (j == 1) {
      emailBody += '<table><tr><th colspan="5"><h3>Search Queries For Last 7 Days:</h3></th></tr>';
      emailBody += '<tr><th>Search Query</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Conversions</th></tr>';
    }
    sendEmail = true;
    emailBody += '<tr><td>' + searchQueries[j].term + '</td><td>' + searchQueries[j].impressions + '</td><td>' + searchQueries[j].clicks +  '</td><td>' + searchQueries[j].ctr + '</td><td>' + searchQueries[j].conversions +  '</td></tr>';
  }
  emailBody += '</table>';
}

function searchQueryRawText() {
  var keywordText = '';
  var keywordObject = {};
  var report = AdWordsApp.report(
    "SELECT Query,Clicks,Cost,Ctr,ClickConversionRate,CostPerConvertedClick,ConvertedClicks,Impressions,CampaignId,AdGroupId " +
    " FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
    " WHERE " +
      " Impressions > 1 " +
    " DURING LAST_7_DAYS");
  var rows = report.rows();
  var i = 1;
  while(rows.hasNext()) {
    var row = rows.next();
    
    /*for (j = 0; j < impressions; j++) {
      keywordText += query + ' ';
    }*/
    keywordText += row['Query'] + '. ';
    keywordObject[i] = {
      term: row['Query'],
      impressions: row['Impressions'],
      clicks: row['Clicks'],
      ctr: row['Ctr'],
      conversions: row['ConvertedClicks']
    };
    i++;
  }
  keywordObject[0] = {
    term: keywordText,
    impressions: 0,
    clicks: 0
  };
  
  Logger.log(keywordObject);
  return keywordObject;
}

function getAdGroupNames() {
  var adGroupIterator = AdWordsApp.adGroups().get();
  var adGroupArray = [];
  
  while (adGroupIterator.hasNext()) {
    var adGroup = adGroupIterator.next();
    var adGroupName = adGroup.getName();
    
    adGroupArray.push(adGroupName);
  }
  
  return adGroupArray;
}

/*************************************
 * IBM Watson Alchemy Languge API v1.0
 * By: Russ Savage (@russellsavage)
 * Usage:
 *  var watson = new AlchemyLanguageAPI({
 *    "url": "https://gateway-a.watsonplatform.net/calls",
 *    "apikey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *  });
 * // Example usage:
 * var resp = watson.URLGetRankedKeywords({ 
 *   url : 'http://searchengineland.com/send-adwords-alerts-directly-slack-adwords-script-library-243870' 
 * });
 * 
 * Full documentation on parameters can be found here:
 * http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/alchemy-language/api/v1/
 ***********************************/
function AlchemyLanguageAPI(config) {
  this.api_key = config.apikey;
  this.base_url = config.url;
  
  // This is a generic function to pull data from an endpoint
  // and send it back as a json object.
  this.callService = function(endpoint, conf) {
    conf.apikey = this.api_key;
    conf.outputMode = 'json';
    
    var params = {
      method : "POST",
      payload : _buildQueryString(conf),
      muteHttpExceptions : true
    };
    var resp = UrlFetchApp.fetch(this.base_url+endpoint, params);
    var jsonResp = JSON.parse(resp.getContentText());
    if(jsonResp.status == "OK") {
      return JSON.parse(resp.getContentText());
    } else {
      throw jsonResp.status + " : " + jsonResp.statusInfo;
    }
  };
  
  // This function is used to dynamically generate the individual endpoints of each endpoint.
  this.generateFunctions = function() {
    var endpoints = _getEndpoints();
    for(var i in endpoints) {
      var endpoint = endpoints[i];
      this[endpoint] = new Function('params', "return this.callService('/text/"+endpoint+"', params);");
    }
  };
  
  // This is a list of endpoints from the docs used for dynamically generating our functions
  // http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/alchemy-language/api/v1/
  function _getEndpoints() {
    return ['TextGetRankedKeywords'];
  };
    
  // This is our helper method to build the query string from
  // the config object.
  function _buildQueryString(keyValueMap) {
    var query_string = [];
    if(keyValueMap) {
      Object.keys(keyValueMap).forEach(function(key) {
        query_string.push(key+'='+encodeURIComponent(keyValueMap[key]));
      });
    }
    return query_string.join('&');
  }
  
  this.generateFunctions();
}