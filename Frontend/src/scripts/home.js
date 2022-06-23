async function getAllOrganisations(){
    const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    const wallet = AElf.wallet.createNewWallet();
    try{
        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
        try {
            const result = await contractInstance.GetOrganisationCount.call();
            const promises = [];
            const promises2 = [];
            for(var i = 1; i <= parseInt(result.value); i++){
                promises.push(contractInstance.GetOrganisationInfo.call({value: i}))
            }

            let organisationsInfoTemp = await Promise.allSettled(promises);
            const organisationsInfo = [];

            for(var i = 0; i < organisationsInfoTemp.length; i ++){
                if(organisationsInfoTemp[i].status == "fulfilled"){
                    organisationsInfo.push(organisationsInfoTemp[i].value)
                } 
            }

            for(var i = 0; i < organisationsInfo.length; i ++){
                promises2.push(fetch("https://ipfs.infura.io/ipfs/" + organisationsInfo[i].descriptionIpfs))
            }

            let ipfsInfoTemp = await Promise.allSettled(promises2);
            for(var i = 0; i < ipfsInfoTemp.length; i ++){
                if(ipfsInfoTemp[i].status == "fulfilled" && ipfsInfoTemp[i].value.status == 200){
                    try{
                        const ipfsResult = await ipfsInfoTemp[i].value.json();
                        organisationsInfo[i].ipfsInfo = ipfsResult;
                    } catch (e){
                        organisationsInfo[i].ipfsInfo = null;
                    }
                } else {
                    organisationsInfo[i].ipfsInfo = null;
                }
            }

            return {
                success: true,
                error_message: null,
                data: organisationsInfo
            }
        } catch(e){
            return {
                success: false,
                error_message: "An error has occurred (GetOrganisationCount)",
                data: null
            }
        }
    } catch(e){
        return {
            success: false,
            error_message: "An error occurred while initializing the smart contract",
            data: null
        }
    } 
}



async function init(){
    const loadingBlock = document.getElementById("loading");
    const errorBlock = document.getElementById("error-block");
    const organisationsBlock = document.getElementById("organisations-block");
    const organisationsData = await getAllOrganisations()
    loadingBlock.classList.add("hidden");

    if(organisationsData.success){
        organisationsBlock.classList.remove("hidden");
        organisationsBlock.innerHTML = "";

        if(organisationsData.data.length == 0){
            organisationsBlock.classList.remove("organisations-block");
            organisationsBlock.style.textAlign = "center";
            organisationsBlock.style.fontSize = "18px";
            organisationsBlock.innerHTML = "No organisations";
            return;
        }

        organisationsData.data.map((organisationInfo) => {
            let logoUrl = '/src/images/noOrganisationImage.png';
            if(organisationInfo.ipfsInfo && organisationInfo.ipfsInfo.logo){
                logoUrl = `https://ipfs.infura.io/ipfs/${organisationInfo.ipfsInfo.logo}`;
            } 
            if(!organisationInfo.isVerified){
                logoUrl = `/src/images/notVerified.png`;
            }

            organisationsBlock.innerHTML += `
                <a href="./organisation.html?id=${organisationInfo.id}">
                    <div class="organisation-card">
                        <div class="organisation-logo" style="background-image: url(${logoUrl});"></div>
                        <div class="organisation-title">
                            <span>${organisationInfo.name}</span>
                            <img ${organisationInfo.isVerified ? '' : 'class="hidden"'} src="./src/images/icons/verified.svg" alt="Verified" title="Verified">
                        </div>
                        <button>Explore</button>
                    </div>
                </a>
            `
        })
    } else {
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = organisationsData.error_message
    }
}


init();


