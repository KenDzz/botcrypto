import Binance from 'binance-api-node'
import TelegramBot from 'node-telegram-bot-api'
import CoinMarketCap from 'coinmarketcap-api'
import dotenv from 'dotenv'
import translate from "translate";
import schedule from "node-schedule";
import mongo from "mongodb";
import mongoose from 'mongoose';
import rp from 'request-promise';
import cheerio from 'cheerio';
import fs from 'fs';
import CronJob from 'node-cron';
import moment from 'moment';
import Request from 'request';
import axios from 'axios';
import { formatMoney } from './utils/money.js'

dotenv.config()

// API keys can be generated here https://www.binance.com/en/my/settings/api-management
const binanceClient = Binance.default({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
})

// API CoinMarketCap
const CoinMarketCapClient = new CoinMarketCap(process.env.COINMARKETCAP_API_KEY)

// The bot token can be obtained from BotFather https://core.telegram.org/bots#3-how-do-i-create-a-bot
const bot = new TelegramBot(process.env.TELEGRAMM_BOT_TOKEN, { polling: true })

getWhaleCrypto()


function getIDChannel() {
    return new Promise(resolve => {
        bot.getChat(process.env.TELEGRAMM_CHANNEL).then(
          (channel) => {
            resolve(channel['id'])
          }
        )
    });
}

function getIDChannel2() {
    return new Promise(resolve => {
        bot.getChat(process.env.TELEGRAMM_CHANNEL_2).then(
          (channel) => {
            resolve(channel['id'])
          }
        )
    });
}



// Connect to the db
var ObjectID = mongo.ObjectID;
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  //don't show the log when it is test
  if(process.env.NODE_ENV !== "test") {
    console.log("\nConnected to %s", process.env.MONGODB_URL);
    console.log("App is running ... \n");
    console.log("Press CTRL + C to stop the process. \n");
    (async () => {
        const idChannel = await getIDChannel();
        bot.sendMessage(idChannel, 'B???o tr?? h??? th???ng Bot ti???n ???o ho??n t???t!');
    })();

  }
}).catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
});
var db = mongoose.connection;

//check Ctrl + C
if(process.env.NODE_ENV !== "test") {
  process.on('SIGINT', function() {
      (async () => {
          const idChannel = await getIDChannel();
          bot.sendMessage(idChannel, 'B???t ?????u b???o tr?? h??? th???ng Bot ti???n ???o sau 3 gi??y n???a!');
      })();
      setTimeout(function () {
        process.exit(1);
      }, 3000)
  });
}
CronJob.schedule('00 00 19 * * *', () => {
  getNews()
}, {
   scheduled: true,
   timezone: "Asia/Ho_Chi_Minh"
 });

CronJob.schedule('00 00 1 * * *', () => {
  getSummingUpWhaleCryptoToday()
}, {
   scheduled: true,
   timezone: "Asia/Ho_Chi_Minh"
 });

CronJob.schedule('30 * * * * *', () => {
  getWhaleCrypto()
}, {
   scheduled: true,
   timezone: "Asia/Ho_Chi_Minh"
 });

CronJob.schedule('50 59 23 31 01 *', () => {
  happyNewYear()
}, {
   scheduled: true,
   timezone: "Asia/Ho_Chi_Minh"
 });

CronJob.schedule('00 00 00 01 02 *', () => {
  happyNewYear2()
}, {
   scheduled: true,
   timezone: "Asia/Ho_Chi_Minh"
 });

function happyNewYear() {
  (async () => {
      const idChannel = await getIDChannel();
      bot.sendMessage(idChannel, `\u{1F386}\u{1F386}\u{1F386}\u{1F386}\n\nV???y l?? ch??? c??n 10s n???a th??i l?? b?????c qua n??m m???i, N??m Nh??m D???n.`);
  })();

  (async () => {
      const idChannel2 = await getIDChannel2();
      bot.sendMessage(idChannel2, `\u{1F386}\u{1F386}\u{1F386}\u{1F386}\n\nV???y l?? ch??? c??n 10s n???a th??i l?? b?????c qua n??m m???i, N??m Nh??m D???n.`);
  })();
}

function happyNewYear2() {
  (async () => {
      const idChannel = await getIDChannel();
      bot.sendMessage(idChannel, `\u{1F386}\u{1F386}\u{1F386}\u{1F386}\n\nN??m m???i Nh??m D???n, Bot Crypto VIP k??nh ch??c m???i ng?????i ????n xu??n sum v???y, ???m ??p, an vui v?? v???n s??? nh?? ??, th??nh c??ng r???c r???! Happy new year!`);
      bot.sendVideo(idChannel, './images/happynewyear.mp4')
  })();

  (async () => {
      const idChannel2 = await getIDChannel2();
      bot.sendMessage(idChannel2, `\u{1F386}\u{1F386}\u{1F386}\u{1F386}\n\nN??m m???i Nh??m D???n, Bot Crypto VIP k??nh ch??c m???i ng?????i ????n xu??n sum v???y, ???m ??p, an vui v?? v???n s??? nh?? ??, th??nh c??ng r???c r???! Happy new year!`);
      bot.sendVideo(idChannel2, './images/happynewyear.mp4')
  })();
}


function getToday() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = mm + '/' + dd + '/' + yyyy;
  return today
}


async function getNews() {
    var options = {
    method: 'GET',
    uri: 'https://tapchibitcoin.io/',
    headers: {
      json: true,
      gzip: true,
      'User-Agent': 'Discordbot/2.0'
    },
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  rp(options)
  .then(function ($) {
    var news  = []
    var today = moment(new Date()).format("DD/MM/YYYY")
    $('.td-block-span12').each((index, el) => { // l???p t???ng ph???n t??? c?? class l?? job__list-item
      if ($(el).find('.td-post-date').text() == today) {
        news.push("- "+$(el).find('.entry-title').text());
      }
    })
    setTimeout(function(){
      (async () => {
        const idChannel = await getIDChannel();
        bot.sendMessage(idChannel, '\u{1F4E3}\u{1F4E3} Tin t???c ti???n ???o ng??y '+today+'\u{1F4E3}\u{1F4E3}\n\n'+news.join('\n\n'));
      })();
    }, 3000);
  })
  .catch(function (err) {
    console.log(err)
  });
}



// Matches "/price [symbol]"
// bot.onText(/\/price -b (.+)/, (msg, data) => {
//   const chatId = msg.chat.id
//   // data[1] can be single token (i.e. "BTC") or pair ("ETH BTC")
//   const [cryptoToken1, cryptoToken2 = 'USDT'] = data[1].split(' ')

//   binanceClient
//     .avgPrice({ symbol: `${cryptoToken1}${cryptoToken2}`.toUpperCase() }) // example, { symbol: "BTCUSTD" }
//     .then((avgPrice) => {
//       bot.sendMessage(chatId, formatMoney(avgPrice['price']))
//     })
//     .catch((error) =>
//       bot.sendMessage(
//         chatId,
//         `L???i cu???n ph??p! Vui l??ng ki???m tra l???i ${cryptoToken1}${cryptoToken2}: ${error}`
//       )
//     )
// })


  //priceCrypto(chatId,cryptoToken1)



//schedule Job 
bot.on('message', (msg) => {
  schedule.scheduleJob('* * * * * *', function(fireDate){
    //bot.sendMessage(msg.from.id, "Hello  " + msg.from.first_name+msg.from.last_name);
    //find_schedule_price(msg.from.id)
    find_price_quote(msg.from.id,msg.chat.id)
  });
})


function apiSimSimi(chatId,msg) {
  var urlEncode = encodeURI(`https://simsimi.info/api/?text=${msg}&lc=vn`)
  axios.get(urlEncode)
    .then(function (response) {
      var data = JSON.parse(JSON.stringify(response['data']));
      bot.sendMessage(chatId, data['success'])
    })
    .catch(function (error) {
      console.log(error);
    })
}


function getWhaleCrypto() {
  axios.get('https://api.whale-alert.io/feed.csv')
    .then(function (response) {
      var data = response['data'].split("\n")
      for (const dataWhale of data) {
        var item = dataWhale.split(",");
        let ts = Date.now();
        let date_ob = new Date(ts);
        let today = date_ob.getDate()+"/"+date_ob.getMonth() + 1+"/"+ date_ob.getFullYear();
        var data_whale = {
          _id: new ObjectID(),
          id: item[0],
          time: item[1],
          symbol: item[2],
          priceusdt: item[3],
          priceusd: item[4],
          from: item[6],
          to: item[8],
          timestamp: today
        };
      filter_whale(item[0],data_whale,parseFloat(item[4]),item[6],item[8],item[3],item[2],item[1])
      }
    })
    .catch(function (error) {
      console.log(error);
    })
}

function filter_whale(id,data_whale,total,from,to,price,symbol,time) {
  var query = {
      "id": id
  };
    
  var quote = db.collection('data_whale').findOne(query);

  quote.then(function(result) {
    var fromExchange,toExchange;
    var formatMoney = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)
    var coverTime = new Date(time*1000).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1")
    if (result == null)  {
      db.collection('data_whale').insert(data_whale);
        // if (total > 10000000 && symbol == 'btc') {
        //   if (from == "") {
        //     fromExchange = "(Ch??a r?? ngu???n)"
        //   }else{
        //     fromExchange = from.toUpperCase()
        //   }

        //   if (to == "") {
        //     toExchange = "(Ch??a r?? ngu???n)"
        //   }else{
        //     toExchange = to.toUpperCase()
        //   }

        //   (async () => {
        //       const idChannel = await getIDChannel();
        //       bot.sendMessage(idChannel, '\u{1F51E}\u{1F51E} \n'+price+''+symbol.toUpperCase()+' ('+formatMoney+')'+'\nV???a ???????c giao d???ch t??? '+fromExchange+' ?????n '+toExchange+'\nTime:'+coverTime);
        //   })();
        // }
    }
  })

}

function getSummingUpWhaleCryptoToday() {
  let ts = Date.now();
  let date_ob = new Date(ts);
  let yesterday = date_ob.getDate()-1+"/"+date_ob.getMonth() + 1+"/"+ date_ob.getFullYear();
  let dayBefore = date_ob.getDate()-2+"/"+date_ob.getMonth() + 1+"/"+ date_ob.getFullYear();
  var query = {
      "timestamp": yesterday
  };
  var query2 = {
      "timestamp": dayBefore
  };
    
  mongo.MongoClient.connect(process.env.MONGODB_URL_TWO, function(err, db) {
    if (err) throw err;
    var dbo = db.db("botcrypto");
    dbo.collection("data_whale").find().toArray(function(err, result) {
      if (err) throw err;
      var sumVolume = 0;
      var sumVolumeBTC = 0;
      var sumVolumeUSDT = 0;
      var totalVolumeBTC = 0;
      var totalVolumeUSDT = 0;
      var totalVolume = result.length;
      for (let i = 0; i < result.length; i++) {
        sumVolume += parseFloat(result[i].priceusd)
        if (result[i].symbol == 'usdt') {
          sumVolumeUSDT += parseFloat(result[i].priceusd)
          totalVolumeUSDT += 1;
        }
        if (result[i].symbol == 'btc') {
          sumVolumeBTC += parseFloat(result[i].priceusd)
          totalVolumeBTC += 1;
        }
      }
      insert_total_volume(sumVolume,sumVolumeBTC,sumVolumeUSDT,totalVolume,totalVolumeBTC,totalVolumeUSDT,yesterday)
      dbo.collection("total_volume").find(query2).toArray(function(err2, result2) {
        if (err2) throw err2;
        var sumVolumePercent = 0;
        var sumVolumeBTCPercent = 0;
        var sumVolumeUSDTPercent = 0;
        var totalVolumePercent = 0;
        var totalVolumeBTCPercent = 0;
        var totalVolumeUSDTPercent = 0;
        for (let i = 0; i < result2.length; i++) {
          sumVolumePercent = ((sumVolume - parseFloat(result2.sumVolume))/100)*100;
          sumVolumeBTCPercent = ((sumVolumeBTC - parseFloat(result2.sumVolumeBTC))/100)*100;
          sumVolumeUSDTPercent = ((sumVolumeUSDT - parseFloat(result2.sumVolumeUSDT))/100)*100;
          totalVolumePercent = ((totalVolume - parseFloat(result2.totalVolume))/100)*100;
          totalVolumeBTCPercent = ((totalVolumeBTC - parseFloat(result2.totalVolumeBTC))/100)*100;
          totalVolumeUSDTPercent = ((totalVolumeUSDT - parseFloat(result2.totalVolumeUSDT))/100)*100;
        }
        (async () => {
            const idChannel = await getIDChannel();
            bot.sendMessage(idChannel, 'Th???ng k?? giao d???ch ng??y '+yesterday+'\n\nT???ng s??? giao d???ch :'+totalVolume+' ('+totalVolumePercent+')\n\nT???ng s??? giao d???ch Bitcoin:'+totalVolumeBTC+' ('+totalVolumeBTCPercent+')\n\nT???ng s??? giao d???ch USDT: '+totalVolumeUSDT+' ('+totalVolumeUSDTPercent+')\n\nT???ng l?????ng giao d???ch: '+new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sumVolume)+' ('+sumVolumePercent+')\n\nT???ng l?????ng giao d???ch Bitcoin: '+new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sumVolumeBTC)+' ('+sumVolumeBTCPercent+')\n\nT???ng l?????ng giao d???ch USDT: '+new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sumVolumeUSDT)+' ('+sumVolumeUSDTPercent+')');
        })();
      });
    });
  });
}


function insert_total_volume(sumVolume,sumVolumeBTC,sumVolumeUSDT,totalVolume,totalVolumeBTC,totalVolumeUSDT,today) {
  var total_volume = {
      _id: new ObjectID(),
      sumVolume: sumVolume,
      sumVolumeBTC: sumVolumeBTC,
      sumVolumeUSDT: sumVolumeUSDT,
      totalVolume: totalVolume,
      totalVolumeBTC: totalVolumeBTC,
      totalVolumeUSDT: totalVolumeUSDT,
      timestamp: today
  };
  db.collection('total_volume').insert(total_volume);
}


function insert_schedule_price(msg,time,crypto) {
  var schedule_prices = {
    _id: new ObjectID(),
    id: msg.from.id,
    username: msg.from.username,
    time: time,
    crypto: crypto,
    status: true,
    timestamp: msg.date
  };

  db.collection('schedule_prices').insert(schedule_prices);
}

function insert_price_quote(msg,price,crypto) {
  CoinMarketCapClient.getQuotes({symbol: `${crypto}`.toUpperCase()}).then(
    (avgPrice) => {
        var slug = avgPrice['data'][crypto.toUpperCase()]['slug']
        var name = avgPrice['data'][crypto.toUpperCase()]['name']
        var price_now = avgPrice['data'][crypto.toUpperCase()]['quote']['USD']['price']
        var price_quote = {
        _id: new ObjectID(),
        id: msg.from.id,
        username: msg.from.username,
        price: price,
        pricen: price_now,
        crypto: crypto,
        name: name,
        slug: slug,
        status: true,
        timestamp: msg.date
      };

      db.collection('price_quote').insert(price_quote);
    }
  ).catch((error) =>
    console.log(error)
  )
}


function update_status_price_quote(msg,price,crypto) {
  var myquery = { 
      "id": msg.from.id,
      "price": price,
      "crypto": crypto
  };
  var newvalues = { $set: {status: "false" } };

  db.collection('price_quote').updateOne(myquery, newvalues)
}

function find_price_quote_exist(msg,price,crypto) {
  var query = {
      "id": msg.from.id,
      "price": price,
      "crypto": crypto
  };
    
  var quote = db.collection('price_quote').findOne(query);

  quote.then(function(result) {
    if (result == null) {
      insert_price_quote(msg,price,crypto)
      bot.sendMessage(msg.chat.id, '?????t l???nh b??o gi?? th??nh c??ng!\nCoin: '+crypto+'\nGi?? target: '+price+'\nCh??c b???n s???m ?????t ???????c target mong mu???n \u{2708}')
    }else {
      bot.sendMessage(msg.chat.id, 'Vui l??ng kh??ng ?????t l???nh tr??ng nhau!')
    }
  })

}


function find_price_quote_exist_off(msg,price,crypto) {
  var query = {
      "id": msg.from.id,
      "price": price,
      "crypto": crypto
  };
    
  var quote = db.collection('price_quote').findOne(query);

  quote.then(function(result) {
    if (result == null) {
      bot.sendMessage(msg.chat.id, 'Kh??ng t??m th???y l???nh b??o gi??!')
    }else {
      update_status_price_quote(msg,price,crypto)
      bot.sendMessage(msg.chat.id, 'T???t l???nh b??o gi?? th??nh c??ng!\nT??n: '+crypto+'\nGi??: '+price)
    }
  })

}

function find_price_quote(id,chatId) {
  var query = {
      "id": id,
  };
    
  var quote = db.collection('price_quote').find(query);

  quote.forEach(
    function(doc) {
      if (doc.status == "true") {
        priceQuote(doc.crypto,chatId,doc.price,doc.slug,doc.name,doc.pricen)
      }
    }, 
    function(err) {
      if (err) {
        console.log("Error: "+err)
      }
    })

}

function find_schedule_price(id) {
    var query = {
        "id": id
    };
    
    var prices = db.collection('schedule_prices').find(query);
    
    prices.forEach(
        function(doc) {
            console.log(doc);
        }, 
        function(err) {
            console.log(err)
        }
    )
}



async function translateVN(msg) {
	return await translate(msg,"vi")
}

function priceQuote(cryptoToken1,chatId,priceQuote,slug,name,pricen) {
  var options = {
    method: 'GET',
    uri: 'https://coinmarketcap.com/currencies/'+slug,
    headers: {
      json: true,
      gzip: true,
      'User-Agent': 'Discordbot/2.0'
    },
    transform: function (body) {
      return cheerio.load(body);
    }
  };

  rp(options)
  .then(function ($) {
    var cPrice = $(".priceValue").text().trim();
    var price = cPrice.replace("$", "")
    if (price == priceQuote) {
      var percentage_t = percentage(price,pricen).toString()
      const percentage_emoji = percentage_t.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      bot.sendMessage(chatId, '\u{1F4B0} '+name+' ???? ?????t ?????n gi??: $'+price+'\nGi?? tr??? '+percentage_emoji+' '+percentage_t+'% so v???i gi?? l??c ?????t target ('+pricen+')\n\u{1F4E2}\u{1F4E2}\u{1F4E2}')
    }
  })
  .catch(function (err) {
    console.log(err)
  });
}


function percentage(a,b) {
  var t = (b-a)
  return t/a*100
}

function percentage_price(chatId,price_f,price_s) {
  var percentage_t = percentage(price_f,price_s).toString()
  const percentage_emoji = percentage_t.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
  bot.sendMessage(chatId, 'Gi?? tr??? '+percentage_emoji+' '+percentage_t+'% so v???i gi?? l??c ban ?????u ('+price_f+')\n\u{1F4E2}\u{1F4E2}\u{1F4E2}')
}

function topToken(chatId, count) {
    CoinMarketCapClient.getIdMap({sort: 'cmc_rank', limit: `${count}`.toUpperCase()}).then(
    (infoToken) =>{
      for (const token of infoToken['data']) {
        const date = new Date(token['first_historical_data']);
        const datecover = date.toISOString().substring(0, 10);
        bot.sendMessage(chatId, '\u{1F4B0}TOP '+token['rank']+'\n\nT??n: '+token['name']+'('+token['symbol']+')\n\nNg??y ra m???t: '+datecover) 
      }
    }
    ).catch(console.error)
}

function infoCrypto(chatId, cryptoToken1) {
  CoinMarketCapClient.getMetadata({symbol: `${cryptoToken1}`.toUpperCase()}).then(
    (infoToken) => {
      const description = infoToken['data'][cryptoToken1.toUpperCase()]['description']
      const name = infoToken['data'][cryptoToken1.toUpperCase()]['name']
      const symbol = infoToken['data'][cryptoToken1.toUpperCase()]['symbol']
      const logo = infoToken['data'][cryptoToken1.toUpperCase()]['logo']
      const tags = infoToken['data'][cryptoToken1.toUpperCase()]['tags']
      const platformName = infoToken['data'][cryptoToken1.toUpperCase()]['platform']['name']
      const tokenAddress = infoToken['data'][cryptoToken1.toUpperCase()]['platform']['token_address']
      const selfreportedtags = infoToken['data'][cryptoToken1.toUpperCase()]['self_reported_tags']
      const website = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['website']
      const twitter = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['twitter']
      const message_board = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['message_board']
      const chat = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['chat']
      const facebook = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['facebook']
      const explorer = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['explorer']
      const reddit = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['reddit']
      const technical_doc = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['technical_doc']
      const source_code = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['source_code']
      const announcement = infoToken['data'][cryptoToken1.toUpperCase()]['urls']['announcement']
      bot.sendPhoto(chatId, logo);
      translateVN(description).then(data => {
        bot.sendMessage(chatId, 'T??n: '+name+'('+symbol+') \n\nM?? t???: '+data+'\n\ntags: '+tags+'\n\nN???n t???ng: '+platformName+'\n\nContract Adress: '+tokenAddress+'\n\nT??? kh??a: '+selfreportedtags+'\n\nWebsite: '+website+'\n\nTwitter: '+twitter+'\n\nB???n tin : '+message_board+'\n\nChat: '+chat+'\n\nFacebook: '+facebook+'\n\nExplorer: '+explorer+'\n\nReddit: '+reddit+'\n\nS??ch tr???ng: '+technical_doc+'\n\nM?? ngu???n: '+source_code+'\n\nAnnouncement: '+announcement)
      })
      }
    ).catch(console.error)
}

function priceCrypto(chatId, cryptoToken1) {
  CoinMarketCapClient.getQuotes({symbol: `${cryptoToken1}`.toUpperCase()}).then(
    (avgPrice) => {
      const price = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['price']
      const volume_24h = formatMoney(avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['volume_24h'])
      const market_cap = formatMoney(avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['market_cap'])
      const percent_change_1h = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['percent_change_1h'].toString()
      const percent_change_24h = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['percent_change_24h'].toString()
      const percent_change_7d = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['percent_change_7d'].toString()
      const percent_change_30d = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['percent_change_30d'].toString()
      const percent_change_60d = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['percent_change_60d'].toString()
      const percent_change_90d = avgPrice['data'][cryptoToken1.toUpperCase()]['quote']['USD']['percent_change_90d'].toString()
      const percent_change_1h_emoji = percent_change_1h.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      const percent_change_24h_emoji = percent_change_24h.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      const percent_change_7d_emoji = percent_change_7d.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      const percent_change_30d_emoji = percent_change_30d.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      const percent_change_60d_emoji = percent_change_60d.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      const percent_change_90d_emoji = percent_change_90d.charAt(0) == "-" ? '\u{1F4C9}':'\u{1F4C8}'
      bot.sendMessage(chatId, '\u{1F4B0}Gi??: <pre>$'+price+'</pre>\n\n\u{1F4B0}Kh???i l?????ng giao d???ch(24h): <pre>'+volume_24h+'</pre>\n\n\u{1F4B0}V???n h??a th??? tr?????ng  : <pre>'+market_cap+'</pre>\n\nThay ?????i gi?? sau 1h:'+percent_change_1h_emoji.concat('<pre>',percent_change_1h,'%','</pre>')+'\n\nThay ?????i gi?? sau 24h:'+percent_change_24h_emoji.concat('<pre>',percent_change_24h,'%','</pre>')+'\n\nThay ?????i gi?? sau 1 ng??y:'+percent_change_24h_emoji.concat('<pre>',percent_change_24h,'%','</pre>')+'\n\nThay ?????i gi?? sau 1 th??ng:'+percent_change_30d_emoji.concat('<pre>',percent_change_30d,'%','</pre>')+'\n\nThay ?????i gi?? sau 2 th??ng:'+percent_change_60d_emoji.concat('<pre>',percent_change_60d,'%','</pre>')+'\n\nThay ?????i gi?? sau 3 th??ng:'+percent_change_90d_emoji.concat('<pre>',percent_change_90d,'%','</pre>')+'\n' ,{parse_mode : "HTML"})
    }
  ).catch((error) =>
      bot.sendMessage(
        chatId,
        `L???i cu???n ph??p! Vui l??ng ki???m tra l???i ${cryptoToken1}: ${error}`
      )
  )
}

function checkImgChart(chatId,urlChart) {
  const path = './images/image.png';
  Request
  .get(urlChart)
  .on('response', function(response) {
    if (response.statusCode == 200) {
      bot.sendMessage(chatId, "Vui l??ng ?????i trong gi??y l??t!");
      download(urlChart, path, () => {
        console.log('??? Done. Download Crypto Chart!')
        bot.sendPhoto(chatId, path);
      })
    }else{
      bot.sendMessage(chatId, "H??? th???ng ch??a h??? tr??? ?????ng ti???n ???o n??y!");
    }
  })
}

const download = (url, path, callback) => {
  Request.head(url, (err, res, body) => {
    Request(url)
      .pipe(fs.createWriteStream(path))
      .on('close', callback)
  })
}

bot.onText(/\/top (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  const [count] = data[1].split(' ')
  topToken(chatId,count);
})

bot.onText(/\/info (.+)/, (msg, data) => {
	const chatId = msg.chat.id
  const [cryptoToken1] = data[1].split(' ')
  infoCrypto(chatId,cryptoToken1)
})

bot.onText(/\/price (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  const [cryptoToken1] = data[1].split(' ')
  priceCrypto(chatId,cryptoToken1)
})

bot.onText(/\/schedule -t (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  // const cryptoToken1 = data[1].split(' ')
  // insert_schedule_price(msg,cryptoToken1[0],cryptoToken1[1])
  bot.sendMessage(chatId, 'H??? th???ng b???o tr?? ch???c n??ng h???n l???ch b??o gi??.')
})

bot.onText(/\/quote -p (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  const cryptoToken1 = data[1].split(' ')
  if (cryptoToken1[2] == 'off') {
    find_price_quote_exist_off(msg,cryptoToken1[0],cryptoToken1[1])
  }else{
    find_price_quote_exist(msg,cryptoToken1[0],cryptoToken1[1])
  }
})

bot.onText(/\/percentage (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  const price = data[1].split(' ')
  percentage_price(chatId,price[0],price[1])
})

bot.onText(/\/c (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  const crypto = data[1].split(' ')
  var symbol = crypto['0'].toUpperCase()+"USDT"
  var urlChart = "https://api.chart-img.com/v1/tradingview/advanced-chart?height=400&symbol="+symbol
  checkImgChart(chatId, urlChart)
})

bot.onText(/\/s (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  apiSimSimi(chatId,data[1])
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id

  switch (msg.text) {
    case 'B???t ?????u':
      bot.sendMessage(chatId, 'H??? th???ng BOT b??o gi?? ti???n ??i???n t???. ??ang trong qu?? tr??nh ph??t tri???n')
      break
    case 'Tr??? gi??p':
      bot.sendMessage(chatId, 'Xem gi??: /price (T??n ti???n ???o) VD: /price DOGE\n\nXem th??ng tin: /info (T??n ti???n ???o) VD: /info DOGE\n\nXem top: /top (s??? top) VD: /top 10\n\nL??n l???ch b??o gi??: /quote -p (gi?? c???n b??o) (T??n ti???n ???o) VD: /quote -p 0.3 DOGE\n T???t l???ch b??o gi??:/quote -p (gi?? c???n b??o) (T??n ti???n ???o) off VD: /quote -p 0.3 DOGE off\n\nT??nh gi?? tr??? gia t??ng ho???c gi???m: /percentage (gi?? ban ?????u) (gi?? sau khi t??ng ho???c gi???m) VD: /percentage 0.2 0.3\n\nXem bi???u ????? ti???n ???o : /c t??n ?????ng ti???n ???o . VD: /c btc', {"reply_markup": {"keyboard": [["B???t ?????u"], ["Tr??? gi??p"], ["About"]]}})
      break
    case 'About':
      bot.sendMessage(chatId, 'Develop by KenDzz\n<a href="https://www.facebook.com/Rin.Boss.Rin/">Facebook</a>\n<a href="https://github.com/KenDzz">Github</a>',{parse_mode : "HTML"})
      break
    default:
      break
  }
})