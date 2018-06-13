import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, AsyncStorage, Alert } from "react-native";
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
    this.state = {
      coginated: false,
      cognitoCredentials: {}
    };
  }

  componentDidMount() {
    //this.fetchAwsCredentials();
    //this.storageGetItem("aws_credetnails", "1").then(result => console.log("Result : ", result));

    // AsyncStorage.getItem("@AppAWSCredential:").then((result, error) => {
    //   console.log("Result : ", result);
    //   console.log("Error : ", error);
    // });

    this.getAWSCredentialsFromStorage()
      .then(result => {
        this.initiateAWS(result);
        this.doAwsProcess();
      })
      .catch(() => {
        this.fetchAwsCredentials()
          .then(response => {
            console.log("Cognito Result : ", response);

            let appState = null;

            this.setState(state => {
              const clonedState = cloneDeep(state);
              clonedState.coginated = true;
              clonedState.cognitoCredentials = response.data;
              appState = clonedState;
              return clonedState;
            });

            this.saveAWSCredentialsToStorage(appState.cognitoCredentials);
            this.initiateAWS(appState.cognitoCredentials);
            this.doAwsProcess();
          })
          .catch(error => {
            console.log("Cognito Aciox Error : ", error);
            this.triggerErrorAlert(error);
          });
      });

    // AsyncStorage.setItem("@MySuperStore:numbers", "8086699702").then((result, error) => {
    //   console.log("Result : ", result);
    //   console.log("Error : ", error);
    // });

    // this.storageGetItem("aws_credetnails").then(result => {
    //   console.log("result : ", result);
    // });
  }

  getAWSCredentialsFromStorage = () => {
    const awsCredentialsObject = {};

    return new Promise((resolve, reject) => {
      AsyncStorage.getItem("@MySuperStore:identityPoolId")
        .then(identityPoolId => {
          awsCredentialsObject.identityPoolId = identityPoolId;
          AsyncStorage.getItem("@MySuperStore:identityId")
            .then(identityId => {
              awsCredentialsObject.identityPoolId = identityId;
              AsyncStorage.getItem("@MySuperStore:tokenId")
                .then(tokenId => {
                  awsCredentialsObject.identityPoolId = tokenId;
                  resolve(awsCredentialsObject);
                })
                .catch(error => reject(error));
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  };

  saveAWSCredentialsToStorage = cognitoCredentials => {
    const cognitoCredentialsKey = Object.keys(cognitoCredentials);
    cognitoCredentialsKey.forEach(ele => {
      AsyncStorage.setItem(`@MySuperStore:${ele}`, cognitoCredentials[cognitoCredentials]);
    });
  };

  fetchAwsCredentials = () => {
    return axios.post("https://47hith9kh1.execute-api.us-east-1.amazonaws.com/prod/get-cognito", {
      developerProviderName: "cognito",
      userId: "48"
    });
  };

  initiateAWS = cognitoCredentials => {
    AWS.config.update({
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: cognitoCredentials.identityPoolId,
        IdentityId: cognitoCredentials.identityId,
        Logins: {
          "cognito-identity.amazonaws.com": cognitoCredentials.tokenId
        }
      }),
      region: "us-east-1"
    });
  };

  doAwsProcess = () => {
    console.log("do AWS Process trigered ..");

    // const AWS_S3 = new AWS.S3();

    // AWS_S3.getBucketCors(
    //   {
    //     Bucket: "cyberinfoscripter"
    //   },
    //   (error, data) => {
    //     if (error) {
    //       console.log("Error occured : ", error);
    //     } else {
    //       console.log("Buckets data : ", data);
    //     }
    //   }
    // );
  };

  triggerErrorAlert = error => {
    Alert.alert(
      "Oops! Some thing went wrong",
      `Error detail : ${error.message ? error.message : "Not Available"}`,
      [{ text: "Cancel", onPress: () => console.log("Cancel Pressed"), style: "cancel" }],
      { cancelable: true }
    );
  };

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
