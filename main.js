'use strict';

var JAMs = JAMs || {
  dependencies: {
    jStat: 'https://cdnjs.cloudflare.com/ajax/libs/jstat/1.5.3/jstat.min.js'
  },
  use: function ( url ) {
    return eval( UrlFetchApp.fetch( url ).getContentText() );
  },
  test: function () {
    eJAMs.use( JAMs.dependencies.jStat );
    var test = jStat.betaln(10, 155);
    Logger.log( test );
  }
};
