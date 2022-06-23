async function uploadMetadata(data){
	let image_cid;
	if(data.logo[0] == "file"){
    	image_cid  = await ipfsInfura.add(data.logo[1]);
    	image_cid = image_cid.path;
	}
	else if(data.logo[0] == "cid"){
		image_cid = data.logo[1];
	}
    const object = {
        "name": data.name,
        "description": data.description,
        "logo": image_cid,
        "website": data.website,
        "twitter": data.twitter,
        "discord": data.discord,
        "telegram": data.telegram,
    }
    const cid  = await ipfsInfura.add(JSON.stringify(object))
    return cid.path;
}


function checkCreateOrganisationFormData(){
	const organisationName = document.getElementById("organisation-name");
	const organisationDescription = document.getElementById("organisation-description");
	const organisationLogo = document.getElementById("organisation-logo");
	const organisationWebsite = document.getElementById("organisation-website");
	const organisationTwitter = document.getElementById("organisation-twitter");
	const organisationDiscord = document.getElementById("organisation-discord");
	const organisationTelegram = document.getElementById("organisation-telegram");

	if(!organisationName.value.trim()){
		organisationName.focus();
		organisationName.classList.add("error");
		return {
			success: false,
			error_message: "Insert the name of organisation."
		}
	}
	if(!organisationDescription.value.trim()){
		organisationName.classList.remove("error");

		organisationDescription.focus();
		organisationDescription.classList.add("error");
		return {
			success: false,
			error_message: "Insert the description of organisation."
		}
	}
	if(!organisationLogo.value.trim()){
		organisationName.classList.remove("error");
		organisationDescription.classList.remove("error");

		organisationLogo.focus();
		organisationLogo.classList.add("error");

		return {
			success: false,
			error_message: "Select a logo for organisation."
		}
	}
	if(organisationLogo.files[0] && organisationLogo.files[0].type != "image/jpeg" && organisationLogo.files[0].type != "image/png"){
		organisationName.classList.remove("error");
		organisationDescription.classList.remove("error");

		organisationLogo.focus();
		organisationLogo.classList.add("error");

		return {
			success: false,
			error_message: "Image must have '.png' or '.jpg' extension!"
		}
	}

	organisationName.classList.remove("error");
	organisationDescription.classList.remove("error");
	organisationLogo.classList.remove("error");

	const data = {
		name: organisationName.value.trim(),
		description: organisationDescription.value.trim(),
		logo: ["file", organisationLogo.files[0]],
		website: organisationWebsite.value.trim(),
		twitter: organisationTwitter.value.trim(),
		discord: organisationDiscord.value.trim(),
		telegram: organisationTelegram.value.trim(),
	}
	return {
		success: true,
		error_message: null,
		data: data
	}
}


async function createOrganisationTransaction(organisationName, metadataUrl) {
 	try {
 		const connection = await aelf.chain.getChainStatus();
	    try{
	    	const wallet = {
	            address: walletAddress
	        };
	        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
	        try {
	        	const result = await contractInstance.CreateOrganisation({
			        name: organisationName,
			        descriptionIpfs: metadataUrl
			    })
			    return {
		            success: true,
		            error_message: null,
		            data: result.result.TransactionId
		        }
	        } catch(e){
	        	return {
		            success: false,
		            error_message: "An error has occurred (CreateOrganisation)",
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
	} catch(e){
        return {
            success: false,
            error_message: "Connection to chain error",
            data: null
        }
    } 
}





async function init(){
	const createOrganisationBtn = document.getElementById("create-organisation-btn");
	const errorBlock = document.getElementById("error-block");
	const infoBlock = document.getElementById("info-block");

	createOrganisationBtn.addEventListener("click", ()=>{
		errorBlock.classList.add("hidden");
		const formCheckResult = checkCreateOrganisationFormData();

		if(formCheckResult.success){
			infoBlock.classList.remove("hidden");
			infoBlock.innerHTML = "Metadata uploading...";

			(async () =>{
				const uploadResult = await uploadMetadata(formCheckResult.data);
				infoBlock.innerHTML = "Please confirm transaction";
				const transactionResult = await createOrganisationTransaction(formCheckResult.data.name, uploadResult);

				if(transactionResult.success){
					infoBlock.innerHTML = `Transaction hash: ${transactionResult.data}. <br><br> Status: <span id="txStatusSpan">fetching...</span>`;
					const transactionStatusResult = await checkTransactionStatus(transactionResult.data);
					if(transactionStatusResult.success){
						infoBlock.classList.remove("hidden");
						document.getElementById("txStatusSpan").innerHTML = transactionStatusResult.data;
					} else {
						infoBlock.classList.add("hidden");
						errorBlock.classList.remove("hidden");
						errorBlock.innerHTML = transactionStatusResult.error_message;
					}
				} else{
					infoBlock.classList.add("hidden");
					errorBlock.classList.remove("hidden");
					errorBlock.innerHTML = transactionResult.error_message;
				}
			})();
		} else{
			errorBlock.classList.remove("hidden");
			errorBlock.innerHTML = formCheckResult.error_message;
		}
	})
}


init();