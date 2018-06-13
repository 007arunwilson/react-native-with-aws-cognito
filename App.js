import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, AsyncStorage, Alert, Button } from "react-native";
import axios from "axios";
import cloneDeep from "lodash/cloneDeep";
import AWS from "aws-sdk";
import Config from "react-native-config";

const instructions = Platform.select({
  ios: "The best IOT netwoking application in IOS",
  android: "The best IOT netwoking application in IOS"
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
    const cognitoInitiater = new Promise((resolve, reject) => {
      this.getAWSCredentialsFromStorage()
        .then(result => {
          this.initiateAWS(result);
          resolve();
        })
        .catch(() => {
          this.fetchAwsCredentials()
            .then(response => {
              let appState = null;

              this.setState(state => {
                const clonedState = cloneDeep(state);
                clonedState.cognitoCredentials = response.data;
                appState = clonedState;
                return clonedState;
              });

              this.saveAWSCredentialsToStorage(appState.cognitoCredentials);
              this.initiateAWS(appState.cognitoCredentials);
              resolve();
            })
            .catch(error => {
              reject(error);
            });
        });
    });
    cognitoInitiater
      .then(() => {
        const AWSCredentials = AWS.Credentials();

        console.log(AWSCredentials);

        // this.setState(state => {
        //   const clonedState = cloneDeep(state);
        //   clonedState.coginated = true;
        //   return clonedState;
        // });
      })
      .catch(error => this.triggerErrorAlert(error));
  }

  getAWSCredentialsFromStorage = () => {
    const awsCredentialsObject = {};

    return new Promise((resolve, reject) => {
      AsyncStorage.getItem("@AppAWSCredentinal:identityPoolId")
        .then(identityPoolId => {
          if (!identityPoolId) {
            return reject();
          }

          awsCredentialsObject.identityPoolId = identityPoolId;
          AsyncStorage.getItem("@AppAWSCredentinal:identityId")
            .then(identityId => {
              if (!identityId) {
                return reject();
              }

              awsCredentialsObject.identityId = identityId;
              AsyncStorage.getItem("@AppAWSCredentinal:tokenId")
                .then(tokenId => {
                  awsCredentialsObject.tokenId = tokenId;
                  if (!tokenId) {
                    return reject();
                  }

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
      AsyncStorage.setItem(`@AppAWSCredentinal:${ele}`, cognitoCredentials[ele]);
    });
  };

  fetchAwsCredentials = () => {
    return axios.post(Config.AWS_COGNITO_CREDENTIALS_REQUEST_URL, {
      developerProviderName: Config.AWS_COGNITO_CREDENTIALS_PROVIDER_NAME,
      userId: Config.AWS_COGNITO_CREDENTIALS_USER_ID
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

    // this.doAwsProcess();
  };

  doAwsProcess = () => {
    const AWS_S3 = new AWS.S3();

    AWS_S3.getBucketCors(
      {
        Bucket: "cyberinfoscripter"
      },
      (error, data) => {
        if (error) {
          const originalError = error.originalError;
          console.log(originalError);
          this.triggerErrorAlert(originalError);
        } else {
          console.log("Buckets data : ", data);
        }
      }
    );
  };

  triggerErrorAlert = error => {
    Alert.alert(
      "Oops! Some thing went wrong",
      `Error detail : ${error.message ? error.message : "Not Available"}`,
      [{ text: "Cancel", style: "cancel" }],
      { cancelable: false }
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Hub.io</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Button
          disabled={!this.state.coginated}
          onPress={this.doAwsProcess}
          title={this.state.coginated ? "Do AWS task" : "Cognitating..."}
        />
      </View>
    );
  }
}
