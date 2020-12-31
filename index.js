const ccxt = require('ccxt')
const axios = require('axios');
const { requestMaker } = require('./siginRequest');

const bitsoClient = new ccxt.bitso({
    apiKey:'YOUR API KEY PROVIDED BY BITSO',
    secret: 'YOUR SECRET PROVIDED BY BITSO',
})

const config = {
    asset: 'XRP',
    base: 'USD',
    allocation: 1,
    spread: 0.03,
    tickInterval: 60000 * 2
};

const tick = async () => {

    // destructuring configs to apply in each iterartion
    const {asset, base, spread,allocation } = config;    
    const market = `${asset}/${base}`

    //fetch balance from bitso account
    const balances = await bitsoClient.fetchBalance()

    // using own request maker to use bitso features not avilables on ccxt
    const orders = await requestMaker("GET","/v3/open_orders?book=xrp_usd")
    orders.payload.forEach(async order => {
        await requestMaker("DELETE", `/v3/orders/${order.oid}/`)
    })

    // get ripple usd price from coingecko
    const prices = await Promise.all([
      axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd'),
    ])


    // calculate vars
    const marketPrice = prices[0].data.ripple.usd
    const sellPrice = marketPrice * ( 1 + spread)
    const buyPrice = marketPrice * ( 1 - spread)
    const assetBalance = balances.free[asset]
    const baseBalance = balances.free[base]
    const sellVolume = assetBalance
    const buyVolume = baseBalance/ marketPrice

       
        await bitsoClient.createLimitBuyOrder(market, buyVolume, buyPrice).catch(err => console.log('ERROR ON SELLING', err))
        await bitsoClient.createLimitSellOrder(market, sellVolume, sellPrice).catch(err => console.log('ERROR ON BUYING', err))
    
        console.log(`
        ------------------------------------------------------------------------------
        BALANCE ACCOUNT: 
        XRP FREE = ${(balances.free.XRP).toFixed(2)}
        USD FREE = ${(balances.free.USD).toFixed(2)}
        BUY VOLUME = ${buyVolume}
        SELL VOLUME = ${sellVolume}
        AT ${new Date().toLocaleString()}
        BUYING PRICE ${buyPrice}
        SELLING PRICE ${sellPrice}
        ------------------------------------------------------------------------------
        `);

}

const run = () => {
    tick(config, bitsoClient)
    setInterval(tick, config.tickInterval, config, bitsoClient)
}

run()
