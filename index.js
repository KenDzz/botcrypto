import Binance from 'binance-api-node'
import TelegramBot from 'node-telegram-bot-api'
import CoinMarketCap from 'coinmarketcap-api'
import dotenv from 'dotenv'
import translate from "translate";
import schedule from "node-schedule";
import mongo from "mongodb";
import mongoose from 'mongoose';
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


// Connect to the db
var ObjectID = mongo.ObjectID;
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  //don't show the log when it is test
  if(process.env.NODE_ENV !== "test") {
    console.log("\nConnected to %s", process.env.MONGODB_URL);
    console.log("App is running ... \n");
    console.log("Press CTRL + C to stop the process. \n");
  }
}).catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
});
var db = mongoose.connection;


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
//         `Lỗi cuốn pháp! Vui lòng kiểm tra lại ${cryptoToken1}${cryptoToken2}: ${error}`
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
  var schedule_prices = {
    _id: new ObjectID(),
    id: msg.from.id,
    username: msg.from.username,
    price: price,
    crypto: crypto,
    status: true,
    timestamp: msg.date
  };

  db.collection('price_quote').insert(schedule_prices);
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
      bot.sendMessage(msg.chat.id, 'Đặt lệnh báo giá thành công!\nCoin: '+crypto+'\nGiá: '+price+'\nChúc bạn sớm đạt được target mong muốn \u{2708}')
    }else {
      bot.sendMessage(msg.chat.id, 'Vui lòng không đặt lệnh trùng nhau!')
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
      priceQuote(doc.crypto,chatId,doc.price)
    }, 
    function(err) {
      console.log("Error: "+err)
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

function priceQuote(cryptoToken1,chatId,priceQuote) {
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
      if (priceQuote == price) {
        bot.sendMessage(chatId, '\u{1F4B0} '+cryptoToken1+' đã đạt đến giá: <pre>$'+price+'</pre>\n\n\u{1F4B0}Khối lượng giao dịch(24h): <pre>'+volume_24h+'</pre>\n\n\u{1F4B0}Vốn hóa thị trường  : <pre>'+market_cap+'</pre>\n\nThay đổi giá sau 1h:'+percent_change_1h_emoji.concat('<pre>',percent_change_1h,'%','</pre>')+'\n\nThay đổi giá sau 24h:'+percent_change_24h_emoji.concat('<pre>',percent_change_24h,'%','</pre>')+'\n\nThay đổi giá sau 1 ngày:'+percent_change_24h_emoji.concat('<pre>',percent_change_24h,'%','</pre>')+'\n\nThay đổi giá sau 1 tháng:'+percent_change_30d_emoji.concat('<pre>',percent_change_30d,'%','</pre>')+'\n\nThay đổi giá sau 2 tháng:'+percent_change_60d_emoji.concat('<pre>',percent_change_60d,'%','</pre>')+'\n\nThay đổi giá sau 3 tháng:'+percent_change_90d_emoji.concat('<pre>',percent_change_90d,'%','</pre>')+'\n' ,{parse_mode : "HTML"})
      }
    }
  ).catch((error) =>
      bot.sendMessage(
        chatId,
        `Lỗi cuốn pháp! Vui lòng kiểm tra lại ${cryptoToken1}: ${error}`
      )
  )
}

function topToken(chatId, count) {
    CoinMarketCapClient.getIdMap({sort: 'cmc_rank', limit: `${count}`.toUpperCase()}).then(
    (infoToken) =>{
      for (const token of infoToken['data']) {
        const date = new Date(token['first_historical_data']);
        const datecover = date.toISOString().substring(0, 10);
        bot.sendMessage(chatId, '\u{1F4B0}TOP '+token['rank']+'\n\nTên: '+token['name']+'('+token['symbol']+')\n\nNgày ra mắt: '+datecover) 
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
        bot.sendMessage(chatId, 'Tên: '+name+'('+symbol+') \n\nMô tả: '+data+'\n\ntags: '+tags+'\n\nNền tảng: '+platformName+'\n\nContract Adress: '+tokenAddress+'\n\nTừ khóa: '+selfreportedtags+'\n\nWebsite: '+website+'\n\nTwitter: '+twitter+'\n\nBản tin : '+message_board+'\n\nChat: '+chat+'\n\nFacebook: '+facebook+'\n\nExplorer: '+explorer+'\n\nReddit: '+reddit+'\n\nSách trắng: '+technical_doc+'\n\nMã nguồn: '+source_code+'\n\nAnnouncement: '+announcement)
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
      bot.sendMessage(chatId, '\u{1F4B0}Giá: <pre>$'+price+'</pre>\n\n\u{1F4B0}Khối lượng giao dịch(24h): <pre>'+volume_24h+'</pre>\n\n\u{1F4B0}Vốn hóa thị trường  : <pre>'+market_cap+'</pre>\n\nThay đổi giá sau 1h:'+percent_change_1h_emoji.concat('<pre>',percent_change_1h,'%','</pre>')+'\n\nThay đổi giá sau 24h:'+percent_change_24h_emoji.concat('<pre>',percent_change_24h,'%','</pre>')+'\n\nThay đổi giá sau 1 ngày:'+percent_change_24h_emoji.concat('<pre>',percent_change_24h,'%','</pre>')+'\n\nThay đổi giá sau 1 tháng:'+percent_change_30d_emoji.concat('<pre>',percent_change_30d,'%','</pre>')+'\n\nThay đổi giá sau 2 tháng:'+percent_change_60d_emoji.concat('<pre>',percent_change_60d,'%','</pre>')+'\n\nThay đổi giá sau 3 tháng:'+percent_change_90d_emoji.concat('<pre>',percent_change_90d,'%','</pre>')+'\n' ,{parse_mode : "HTML"})
    }
  ).catch((error) =>
      bot.sendMessage(
        chatId,
        `Lỗi cuốn pháp! Vui lòng kiểm tra lại ${cryptoToken1}: ${error}`
      )
  )
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
  bot.sendMessage(chatId, 'Hệ thống bảo trì chức năng hẹn lịch báo giá.')
})

bot.onText(/\/quote -p (.+)/, (msg, data) => {
  const chatId = msg.chat.id
  const cryptoToken1 = data[1].split(' ')
  find_price_quote_exist(msg,cryptoToken1[0],cryptoToken1[1])
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id

  switch (msg.text) {
    case '/start':
      bot.sendMessage(chatId, 'Anh Quá Dz! Xin chào.')
      break
    case '/help':
      bot.sendMessage(chatId, 'Sử dụng lệnh /price -b (Tên tiền ảo) VD: /price -b DOGE -> Xem giá... Lưu ý: Đang trong quá trình dev chỉ xem được những đồng đã list Binance', {"reply_markup": {"keyboard": [["/start"], ["/help"]]}})
      break

    default:
      break
  }
})