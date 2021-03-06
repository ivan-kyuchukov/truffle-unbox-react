import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded: false, cost: 50, itemName: "example_1" };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      console.log('user accounts', this.accounts)

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      this.itemManager = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[this.networkId] && ItemManagerContract.networks[this.networkId].address,
      );

      this.item = new this.web3.eth.Contract(
        ItemContract.abi,
        ItemContract.networks[this.networkId] && ItemContract.networks[this.networkId].address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ loaded: true });
      this.onPayment();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };
  
  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    })
  }

  handleSubmit = async() => {
    const {cost, itemName} = this.state;
    const result = await this.itemManager.methods.createItem(itemName, cost).send({from: this.accounts[0]});
    // console.log(result);
    // const address = result.events.SupplyChainStep.returnValues._address;
    // alert(`Send ${cost} wei to this address: ${address} for this item: ${itemName}`);
  }

  onPayment = () => {
    this.itemManager.events.SupplyChainStep().on('data', (evt) => {
      console.log('evt on payment', evt)
      this.itemManager.methods.items(evt.returnValues._itemIndex).call().then((data) => {
        
        if(data._step == 0) {
          console.log('ITEM_ADDED', data._identifier, data);
          alert(`Send ${data._itemPrice} wei to this address: ${data._item} for this item: ${data._identifier}`)

        } else if(data._step == 1) {
          console.log('ITEM_PAID', data._identifier, data);
          alert(`Item ${data._identifier} paid with ${data._itemPrice} wei.`)

        } else if(data._step == 2) {
          console.log('ITEM_DELIVERED', data._identifier, data);
          alert(`Item ${data._identifier} shipped.`)
        }

      });
    })
  }

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Event Trigger Supply Chain Example</h1>
        <h2>Items</h2>
        <h2>Add Items</h2>
        Cost in Wei: <input type="text" name="cost" value={this.state.cost} onChange={this.handleInputChange} />
        Item Identifier: <input type="text" name="itemName" value={this.state.itemName} onChange={this.handleInputChange} />
        <button type="button" onClick={this.handleSubmit}>Create new item</button>
      </div>
    );
  }
}

export default App;
