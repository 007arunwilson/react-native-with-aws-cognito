import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, AsyncStorage } from "react-native";
import axios from "axios";
import cloneDeep from "lodash/cloneDeep";
import AWS from "aws-sdk";

const instructions = Platform.select({
  ios: "Press Cmd+R to reload,\n Cmd+D or shake for dev menu",
  android: "Double tap R on your keyboard to reload,\n Shake or press menu button for dev menu"
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});

export default class App extends Component {
  constructor(props) {
    super(props);
    this.fetchAwsCrdentials = null;
    let Console: {
      new(): Console,
      prototype: Console
    };
    this.console = Console;
  }

  componentDidMount() {
    this.fetchAwsCrdentials();
  }

  fetchAwsCrdentials = () => {
    this.console.log("fetching of AWS credentials initated");
    axios
      .post("https://47hith9kh1.execute-api.us-east-1.amazonaws.com/prod/get-cognito", {
        developerProviderName: "cognito",
        userId: "48"
      })
      .then(response => {
        this.console.log("Cognito Result : ", response);

        const stateVar = null;

        this.setState(state => {
          const clonedState = cloneDeep(state);
          clonedState.coginated = true;
          clonedState.cognitoCredentials = response.data;
          return clonedState;
        });

        AWS.config.update({
          credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: "IDENTITY_POOL_ID",
            IdentityId: "IDENTITY_ID_RETURNED_FROM_YOUR_PROVIDER",
            Logins: {
              "cognito-identity.amazonaws.com": "TOKEN_RETURNED_FROM_YOUR_PROVIDER"
            }
          }),
          region: "us-east-1"
        });

        const AWS_S3 = new AWS.S3();

        AWS_S3.listBuckets((error, data) => {
          if (error) {
            console.log("Error occured : ", error);
          } else {
            console.log("Buckets data : ", data);
          }
        });

        //this.saveAwsCredentialsToASync(stateVar.cognitoCredentials);
      })
      .catch(error => {
        this.console.log("Cognito Error : ", error);
      });
  };

  storageSetItem = async (key_, value_) =>
    new Promise(async (resolve, reject) => {
      try {
        await AsyncStorage.setItem(`@MySuperStore:${key_}`, value_, () => {
          resolve(value_);
        });
      } catch (error) {
        this.console.log("storageSetItem save error : ", error);
        reject(error);
      }
    });

  storageGetItem = async key_ =>
    new Promise(async (resolve, reject) => {
      try {
        await AsyncStorage.getItem(`@MySuperStore:${key_}`, (error, result) => {
          if (error) {
            throw error;
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native!</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}
