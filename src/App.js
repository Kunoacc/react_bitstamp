import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import UseWebSocket from "react-use-websocket";

function usePrevious(value){
  const reference = useRef()
  useEffect(() => {
    reference.current = value
  })
  return reference.current
}

function App() {
  const [pairings, setPairings] = useState([])
  const updatePairings = (data) => setPairings(data)

  const [pairing, setPairing] = useState('ltcusd')
  const updatePairing = (data) => setPairing(data)
  const handlePairingChange = (event) => updatePairing(event.target.value)
  const previousPairing = usePrevious(pairing)

  const [orders, setOrders] = useState([])
  const updateOrders = (data) => setOrders([data])
  const resetOrders = () => setOrders([])

  const wsOptions = useMemo(() => ({
    onMessage: message => {
      message = JSON.parse(message.data)
      switch (message.event) {
        case "data":
          console.log(message.data)
          updateOrders(message.data)
          break;
        case "bts:error":
          console.log(message.data)
        default:
          break;
      }
    }
  }), [])

  const [sendMessage, _, readyState] = UseWebSocket('wss://ws.bitstamp.net', wsOptions)

  const formatPairing = (pairing) => [...pairing].map(x => (x !== "/") ? x : null).join("").toLowerCase()

  const getCurrencyPair = (pairing) => [[...pairing].slice(0,3).join(""), [...pairing].slice(3,6).join("")]

  let initialSubscribe = {
    "event": "bts:subscribe",
    "data": {
      "channel": `order_book_ltcusd`
    }
  }

  const eventSubscribe = channel => ({
    "event": "bts:subscribe",
    "data": {
      "channel": `order_book_${channel}`
    }
  });

  const eventUnSubscribe = channel => ({
    "event": "bts:unsubscribe",
    "data": {
      "channel": `order_book_${channel}`
    }
  });

  useEffect(() => {
    console.log(readyState)
    const getPairings = async () => {
      let response = await fetch('https://www.bitstamp.net/api/v2/trading-pairs-info')
      let data = await response.json()
      console.log(data)
      updatePairings(data.map(x => x.name))
      console.log(pairing)
    }
    getPairings()
  }, [])

  useEffect(() => {
    if (readyState === WebSocket.OPEN) {
      sendMessage(JSON.stringify(initialSubscribe))
    }
  }, [readyState])

  useEffect(() => {
    if(pairings.length > 0){
      sendMessage(JSON.stringify(eventUnSubscribe(previousPairing)))
      resetOrders()
      sendMessage(JSON.stringify(eventSubscribe(pairing)))
    }
  }, [pairing])

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <select onChange={handlePairingChange} className="pairings">
          {
            pairings.length < 1 ? 'Loading...' : pairings.map((x, index) => <option value={formatPairing(x)} key={index}>{x}</option>)
          }
        </select>
        <div className="order-books">
          <div id="asks">
            <h1>Bids</h1>
            {
              orders.length < 1 ? <p>Loading...</p> :
              orders.map(x => x.bids).flat()
                .map((bids, index) =>
                  <p key={index}>
                    {`${bids[1]} ${getCurrencyPair(pairing)[0].toUpperCase()} at ${bids[0]} ${getCurrencyPair(pairing)[1].toUpperCase()}`}
                  </p>
                )
            }
          </div>
          <div id="bids">
            <h1>Asks</h1>
            {
              orders.length < 1 ? <p>Loading...</p> :
              orders.map(x => x.asks).flat()
                .map((asks, index) =>
                  <p key={index}>
                    {`${asks[1]} ${getCurrencyPair(pairing)[0].toUpperCase()} at ${asks[0]} ${getCurrencyPair(pairing)[1].toUpperCase()}`}
                  </p>
                )
            }
          </div>
        </div>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
