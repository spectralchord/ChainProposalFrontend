function copyWallet(wallet){
    navigator.clipboard.writeText(wallet);
}

function formatWallet(wallet, nrChar){
    return wallet.substr(0, nrChar) + " . . . " + wallet.substr(nrChar * (-1))
}

function shortText(text, nrChar){
    if(text.length <= nrChar){
        return text;
    } else {
        return text.substr(0, nrChar) + " ...";
    }
}


const toTimestamp = (strDate) => {    
    const dt = Date.parse(strDate);    
    return dt / 1000;    
}    


async function checkTransactionStatus(txHash){
    try {
        const response = await fetch(`${chainEndpoint}/api/blockChain/transactionResult?transactionId=${txHash}`);
        const result = await response.json();
        if(result.Error){
            if(result.Error.Message){
                return {
                    success: false,
                    error_message: `Transaction Error: <u>${result.Error.Message}</u>`,
                    data: null
                }
            }
            else{
                return {
                    success: false,
                    error_message: `Transaction Error: <u>${result.Error.replace("AElf.Sdk.CSharp.AssertionException:", "")}</u>`,
                    data: null
                }
            }
            return;
        }
        else {
            return {
                success: true,
                error_message: null,
                data: `Succes`
            }
        }
    } catch (e){
        return {
            success: false,
            error_message: "Error fetching transaction status",
            data: null
        }
    }
}

function handleConnectEvents(walletAddress){
    const walletAddressBlock = document.getElementById("wallet-address-block");
    walletAddressBlock.classList.remove("hidden");
    walletAddressBlock.innerHTML = `
        <span>${formatWallet(walletAddress, 9)}</span>
        <a class="copy" onclick="copyWallet('${walletAddress}')"><i class="fa-solid fa-copy"></i></a>
    `;
    connectWalletBtn.classList.add("hidden");
    disconnectWalletBtn.classList.remove("hidden");

    if(page == "create-organisation"){
        const loadingBlock = document.getElementById("loading");
        const errorBlock = document.getElementById("error-block");
        const createOrganisationForm = document.getElementById("create-organisation-form");
        loadingBlock.classList.add("hidden");
        errorBlock.classList.add("hidden");
        createOrganisationForm.classList.remove("hidden");
    }
    else if(page == "create-proposal"){
        const loadingBlock = document.getElementById("loading");
        const errorBlock = document.getElementById("error-block");
        loadingBlock.classList.add("hidden");
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = "Please refresh page";
        init();
    }
}


function handleDisconnectEvents(){
    const walletAddressBlock = document.getElementById("wallet-address-block");
    walletAddressBlock.classList.remove("hidden");
    walletAddressBlock.innerHTML = '';
    connectWalletBtn.classList.remove("hidden");
    disconnectWalletBtn.classList.add("hidden");

    if(page == "create-organisation"){
        const loadingBlock = document.getElementById("loading");
        const errorBlock = document.getElementById("error-block");
        const createOrganisationForm = document.getElementById("create-organisation-form");
        loadingBlock.classList.add("hidden");
        createOrganisationForm.classList.add("hidden");
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = "Please connect wallet"
    }
    else if(page == "create-proposal"){
        const loadingBlock = document.getElementById("loading");
        const errorBlock = document.getElementById("error-block");
        const createProposalForm = document.getElementById("create-proposal-form");
        loadingBlock.classList.add("hidden");
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = "Please connect wallet";
        createProposalForm.classList.add("hidden");
    }
}


function handleNoExtensionEvents(){
    const errorNoExtension = document.getElementById("error-no-extension");
    errorNoExtension.classList.remove("hidden");
    errorNoExtension.innerHTML = "Please install Night Elf extension";

    if(page == "create-organisation"){
        const loadingBlock = document.getElementById("loading");
        const errorBlock = document.getElementById("error-block");
        const createOrganisationForm = document.getElementById("create-organisation-form");
        loadingBlock.classList.add("hidden");
        createOrganisationForm.classList.add("hidden");
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = "Please install Night Elf extension"
    }
    else if(page == "create-proposal"){
        const loadingBlock = document.getElementById("loading");
        const errorBlock = document.getElementById("error-block");
        loadingBlock.classList.add("hidden");
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = "Please install Night Elf extension"
    }
}


