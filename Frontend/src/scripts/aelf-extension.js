const connectWalletBtn = document.getElementById("connect-wallet");
const disconnectWalletBtn = document.getElementById("disconnect-wallet");

let aelf = null;
let walletAddress;
let userLogin = false;
let nightElfInstance = null;

const contractAddress = "ELF_8rGPzbQCDkMS4f2je7VxNUxGGwgcdUQcoBNwesCoqaGWmR9oB_tDVW";
const chainEndpoint = "https://explorer-test-side02.aelf.io/chain";

class NightElfCheck {
  constructor() {
    const readyMessage = "NightElf is installed!";
    let resovleTemp = null;

    this.check = new Promise((resolve, reject) => {
      if (window.NightElf) {
        resolve(readyMessage);
      }
      setTimeout(() => {
        reject({
          error: 200001,
          message:
            "Please install Night Elf extension",
        });
      }, 1000);
      resovleTemp = resolve;
    });

    document.addEventListener("NightElf", (result) => {
        resovleTemp(readyMessage);
    });
  }

  static getInstance() {
    if (!nightElfInstance) {
      nightElfInstance = new NightElfCheck();
      return nightElfInstance;
    }
    return nightElfInstance;
  }
}

const nightElfCheck = NightElfCheck.getInstance();

nightElfCheck.check.then((message) => {
  aelf = new window.NightElf.AElf({
    httpProvider: [chainEndpoint],
    appName: "ChainProposals",
  });

  aelf.login({
    chainId: "AELF",
    payload: {
      method: "LOGIN",
    },
  })
  .then((result) => {
    userLogin = true;
    walletAddress = JSON.parse(result.detail).address;
    handleConnectEvents(walletAddress)
  })
  .catch((error) => {
    console.log(error);
  });

})
.catch(function (e) {
  if (e.error == 200001) {
    console.log("Please install Night Elf extension");
    handleNoExtensionEvents();

    connectWalletBtn.onclick = function () {
      console.log("Please install Night Elf extension")
    };
  }
});





connectWalletBtn.onclick = function () {
  aelf.login({
    chainId: "AELF",
    payload: {
      method: "LOGIN",
    },
  })
  .then((result) => {
    userLogin = true;
    walletAddress = JSON.parse(result.detail).address;
    handleConnectEvents(walletAddress)
  })
  .catch((error) => {
    console.log(error);
  });
};

disconnectWalletBtn.onclick = function () {
  aelf.logout({
    chainId: "AELF",
    address: walletAddress,
  })
  .then((result) => {
    userLogin = false;
    handleDisconnectEvents()
  })
  .catch((error) => {
    console.log(error);
  });
};