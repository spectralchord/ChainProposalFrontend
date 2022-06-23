async function checkValidOrganisationId(){
	const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let errorMessage = "";
    let organisationId = null;

    if(urlParams.has('organisation')) {
        organisationId = parseInt(urlParams.get('organisation'));
        try{
        	const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    		const wallet = AElf.wallet.createNewWallet();
    		try {
    			const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
    			try {
	            	const organisationInfo = await contractInstance.GetOrganisationInfo.call({value: organisationId});
		            const ipfsInfoTemp = await fetch("https://ipfs.infura.io/ipfs/" + organisationInfo.descriptionIpfs);

		            if(ipfsInfoTemp.status == 200){
	                    try{
	                        const ipfsResult = await ipfsInfoTemp.json();
	                        organisationInfo.ipfsInfo = ipfsResult;
	                    } catch (e){
	                        organisationInfo.ipfsInfo = null;
	                    }
	                } else {
	                    organisationInfo.ipfsInfo = null;
	                }
	            	return {
		                success: true,
		                error_message: null,
		                data: organisationInfo
		            }
	            } catch(e){
		            return {
		                success: false,
		                error_message: "An error has occurred (GetOrganisationInfo)",
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
                error_message: "Chain init error",
                data: null
            }
        }
    } else {
    	return {
            success: false,
            error_message: "This organisation does not exist.",
            data: null
        }
    }
}

function inputDateToTimestamp(item){
	let eventDateObject = new Date(item.value);
	let year = eventDateObject.getFullYear();
	let month = eventDateObject.getMonth();
	let date = eventDateObject.getDate();
	let hours = eventDateObject.getHours();
	let minutes = eventDateObject.getMinutes();
	return parseInt(Date.UTC(year, month, date, hours, minutes) / 1000);	
}

async function uploadMetadata(data){
    const object = {
        "name": data.name,
        "description": data.description,
        "deadline": data.deadline,
        "option": data.options,
    }
    const cid  = await ipfsInfura.add(JSON.stringify(object))
    return [cid.path, object];
}

function checkCreateProposalFormData(){
	const proposalName = document.getElementById("proposal-name");
	const proposalDescription = document.getElementById("proposal-description");
	const proposalEndTime = document.getElementById("proposal-endTime");
	const proposalsOptions = document.querySelectorAll(".form-option");
	let completedOptions = [];
	let completedOptionsCount = 0;

	proposalsOptions.forEach((optionInput) =>{
		if(optionInput.value.trim()){
			completedOptionsCount ++;
			completedOptions.push(optionInput.value.trim())
		}
	})

	const currentUTCdate = new Date().toISOString().substr(0,16);
	proposalEndTime.setAttribute("min", currentUTCdate)
	const currentTimeToUtcTimestamp = toTimestamp(new Date().toUTCString());
	const dateUtcToTimestamp = inputDateToTimestamp(proposalEndTime);

	if(!proposalName.value.trim()){
		proposalName.focus();
		proposalName.classList.add("error");
		return {
			success: false,
			error_message: "Insert the name of proposal."
		}
	}
	if(!proposalDescription.value.trim()){
		proposalName.classList.remove("error");
		proposalDescription.focus();
		proposalDescription.classList.add("error");
		return {
			success: false,
			error_message: "Insert the description of proposal."
		}
	}
	if(completedOptionsCount < 2){
		proposalName.classList.remove("error");
		proposalDescription.classList.remove("error");
		proposalsOptions[0].focus();
		proposalsOptions.forEach((optinInput) =>{
			optinInput.classList.add("error");
		})
		return {
			success: false,
			error_message: "Write at least 2 options"
		}
	}
	if(!proposalEndTime.value.trim()){
		proposalName.classList.remove("error");
		proposalDescription.classList.remove("error");
		proposalsOptions.forEach((optinInput) =>{
			optinInput.classList.remove("error");
		})
		proposalEndTime.focus();
		proposalEndTime.classList.add("error");
		return {
			success: false,
			error_message: "Select a date."
		}
	}
	if(dateUtcToTimestamp - currentTimeToUtcTimestamp <= 0){
		proposalName.classList.remove("error");
		proposalDescription.classList.remove("error");
		proposalsOptions.forEach((optinInput) =>{
			optinInput.classList.remove("error");
		})
		proposalEndTime.focus();
		proposalEndTime.classList.add("error");
		return {
			success: false,
			error_message: "Deadline date must be greater than the current date."
		}
	}

	proposalName.classList.remove("error");
	proposalDescription.classList.remove("error");
	const data = {
		name: proposalName.value.trim(),
		description: proposalDescription.value.trim(),
		options: completedOptions,
		deadline: dateUtcToTimestamp,
	}
	return {
		success: true,
		error_message: null,
		data: data
	}
}


async function getAllMembers(organisationId){
    const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    const wallet = AElf.wallet.createNewWallet();
    try{
        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
        try {
            const result = await contractInstance.GetOrganisationMembers.call({value: organisationId});
            return {
                success: true,
                error_message: null,
                data: result
            }
        } catch(e){
            return {
                success: false,
                error_message: "An error has occurred (GetOrganisationMembers)",
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




async function createProposalTransaction(organisationId, metadataUrl, data) {
 	try {
 		const connection = await aelf.chain.getChainStatus();
	    try{
	    	const wallet = {
	            address: walletAddress
	        };
	        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
	        try {
	        	const result = await contractInstance.CreateProposal({
			        organisationId: organisationId,
			        infoIpfs: metadataUrl,
			        endTime: {
					    seconds: data.deadline,
					    nanos: 0
					 },
			        optionVotes: data.option.length
			    })
			    return {
		            success: true,
		            error_message: null,
		            data: result.result.TransactionId
		        }
	        } catch(e){
	        	return {
		            success: false,
		            error_message: "An error has occurred (Createproposal)",
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
    const createProposalForm = document.getElementById("create-proposal-form");
	const createProposalBtn = document.getElementById("create-proposal-btn");
	const loadingBlock = document.getElementById("loading");
	const errorBlock = document.getElementById("error-block");
	const infoBlock = document.getElementById("info-block");

	loadingBlock.classList.remove("hidden");
	errorBlock.classList.add("hidden");

	const checkResult = await checkValidOrganisationId();
	if(checkResult.success){
		const organisationId = checkResult.data.id;
		const membersResult = await getAllMembers(organisationId);

		if(membersResult.success){
			let isMember = false;
			for(var i = 0; i < membersResult.data.members.length; i++){
				if(membersResult.data.members[i].toLowerCase() == walletAddress.trim().toLowerCase()){
					isMember = true;
					break;
				}
			}

			loadingBlock.classList.add("hidden");
			if(isMember){
				createProposalForm.classList.remove("hidden");
				
				createProposalBtn.addEventListener("click", ()=>{
					errorBlock.classList.add("hidden");
					const formCheckResult = checkCreateProposalFormData();
					if(formCheckResult.success){
						infoBlock.classList.remove("hidden");
						infoBlock.innerHTML = "Metadata uploading...";
						
						(async () =>{
							const uploadResult = await uploadMetadata(formCheckResult.data);
							infoBlock.innerHTML = "Please confirm transaction";
							const transactionResult = await createProposalTransaction(organisationId, uploadResult[0], uploadResult[1]);
							
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
			} else {
				errorBlock.classList.remove("hidden");
	        	errorBlock.innerHTML = "You are not a member from this organisation";
			}
		} else {
	        errorBlock.classList.remove("hidden");
	        errorBlock.innerHTML = checkResult.error_message
	    }
	} else {
        loadingBlock.classList.add("hidden");
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = checkResult.error_message
    }
}