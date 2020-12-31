require('dotenv').config;

const ccxt = require('ccxt')
const axios = require('axios')

const config = {
    asset: 'XRP',
    base: 'USD',
    allocation: 10,
    spread: 0.0008,
    tickInterval: 60000
};
const bitsoClient = new ccxt.bitso({
    apiKey:'pQnrWFrIve',
    secret: 'd088ffdc62a10770794f77f8bd9af854',
})

let lastSell
let lastBuy

const tick = async () => {
    try{
        const balances = await bitsoClient.fetchBalance()

             // const orders = await bitsoClient.fetchOpenOrders('XRP/USD')
        // orders.forEach(async order => {
        //     console.log(order.id);
        //     bitsoClient.cancelOrder(order.id,'XRP/USD')
        // })
         const prices = await Promise.all([
             axios.get('https://api.bitso.com/v3/ticker/?book=xrp_usd')
         ])
    
         const highBuyPrice = parseFloat(prices[0].data.payload.bid - config.spread).toFixed(4)
         const minimunSellPrice = parseFloat(prices[0].data.payload.ask + config.spread).toFixed(4)
    
         console.log(`
         MARKET PRICES
         PRECIO MAXIMO DE COMPRA: ${highBuyPrice}
         PRECIO MINIMO DE VENTA: ${minimunSellPrice}
         `);
         console.log('CANTIDAD DE COMPRA POSIBLE',(balances.free.USD / highBuyPrice).toString().match(/^-?\d+(?:\.\d{0,3})?/)[0]);
    
         if(balances.free.XRP > 30){
             await bitsoClient.createLimitOrder('XRP/USD', 'sell', balances.free.XRP, minimunSellPrice)
             console.log(`VENDIENDO ${balances.free.XRP} XRP A ${minimunSellPrice}`);
            
         }
        
         if(balances.free.USD > 9){
             if(lastSell > highBuyPrice){
                
                const buyAmount = (balances.free.USD / highBuyPrice)
                await bitsoClient.createLimitOrder('XRP/USD', 'buy', buyAmount, highBuyPrice)
                console.log(`COMPRANDO ${balances.free.USD} USD A ${minimunSellPrice}`);
             }
         
         }

        console.log(`
        ------------------------------------------------------------------------------
        BALANCE ACCOUNT: 
        XRP FREE = ${balances.free.XRP}
        USD FREE = ${balances.free.USD}
        AT ${new Date().toLocaleString()}
        ------------------------------------------------------------------------------
        `);
    }catch(errors){
        console.log(errors);
    }

}

const run = () => {
    tick(config, bitsoClient)
    setInterval(tick, config.tickInterval, config, bitsoClient)
}

run()
