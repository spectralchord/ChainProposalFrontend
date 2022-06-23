async function checkValidProposalId(){
	const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let errorMessage = "";
    let organisationId = null;
    let proposalId = null;

    if(urlParams.has('id')) {
        try{
        	const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    		const wallet = AElf.wallet.createNewWallet();
    		try {
    			const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
    			try {
    				organisationId = parseInt(urlParams.get('id').split("_")[0]);
    				proposalId = parseInt(urlParams.get('id').split("_")[1]);

	            	const proposalInfo = await contractInstance.GetProposalInfo.call({
	            		organisationId: organisationId,
	            		proposalId: proposalId
	            	});
		            const ipfsInfoTemp = await fetch("https://ipfs.infura.io/ipfs/" + proposalInfo.infoIpfs);

		            if(ipfsInfoTemp.status == 200){
	                    try{
	                        const ipfsResult = await ipfsInfoTemp.json();
	                        proposalInfo.ipfsInfoDetails = ipfsResult;
	                    } catch (e){
	                        proposalInfo.ipfsInfoDetails = null;
	                    }
	                } else {
	                    proposalInfo.ipfsInfoDetails = null;
	                }
	            	return {
		                success: true,
		                error_message: null,
		                data: proposalInfo
		            }
	            } catch(e){
		            return {
		                success: false,
		                error_message: "An error has occurred (GetProposalInfo)",
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


async function getProposalResults(proposalId, organisationId){
    const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    const wallet = AElf.wallet.createNewWallet();
    try{
        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
        try {
            const result = await contractInstance.GetProposalOptionVotes.call({
            	organisationId: organisationId,
            	proposalId: proposalId,
            });
            return {
                success: true,
                error_message: null,
                data: result
            }
        } catch(e){
            return {
                success: false,
                error_message: "An error has occurred (GetProposalOptionVotes)",
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



async function getProposalVoters(proposalId, organisationId){
    const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    const wallet = AElf.wallet.createNewWallet();
    try{
        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
        try {
            const result = await contractInstance.GetProposalVoters.call({
            	organisationId: organisationId,
            	proposalId: proposalId,
            });
            return {
                success: true,
                error_message: null,
                data: result
            }
        } catch(e){
            return {
                success: false,
                error_message: "An error has occurred (GetProposalVoters)",
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



async function voteTransaction(proposalId, organisationId, optionId) {
	const errorBlockOptions = document.getElementById("error-block-options");
	const infoBlockOptions = document.getElementById("info-block-options");
	errorBlockOptions.classList.add("hidden");
	infoBlockOptions.classList.add("hidden");

	let error_message = "";
	if(!userLogin){
		errorBlockOptions.classList.remove("hidden");
    	errorBlockOptions.innerHTML = "Please connect wallet";
	} else {
	 	try {
	 		const connection = await aelf.chain.getChainStatus();
		    try{
		    	const wallet = {
		            address: walletAddress
		        };
		        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
		        try {
		        	infoBlockOptions.classList.remove("hidden");
	    			infoBlockOptions.innerHTML = "Please confirm transaction";
		        	const result = await contractInstance.VoteForProposal({
				        organisationId: organisationId,
	            		proposalId: proposalId,
	            		optionId: optionId,
				    })

				    error_message = null;
				    if(result.result.TransactionId){
				    	infoBlockOptions.innerHTML = `Transaction hash: ${result.result.TransactionId}. <br><br> Status: <span id="txStatusSpan">fetching...</span>`;
						const transactionStatusResult = await checkTransactionStatus(result.result.TransactionId);
						if(transactionStatusResult.success){
							infoBlockOptions.classList.remove("hidden");
							document.getElementById("txStatusSpan").innerHTML = transactionStatusResult.data;
						} else {
							infoBlockOptions.classList.add("hidden");
							errorBlockOptions.classList.remove("hidden");
							errorBlockOptions.innerHTML = transactionStatusResult.error_message;
						}
				    }
		        } catch(e){
		        	error_message = "An error has occurred (VoteForProposal)";
		        }
		    } catch(e){
		       	error_message = "An error occurred while initializing the smart contract";
		    } 
		} catch(e){
	    	error_message = "Connection to chain error";
	    } 
	    if(error_message){
	    	errorBlockOptions.classList.remove("hidden");
	    	errorBlockOptions.innerHTML = error_message;
	    	infoBlockOptions.classList.add("hidden");
	    }
	}
}


async function init(){
	const loadingBlock = document.getElementById("loading");
	const errorBlock = document.getElementById("error-block");

	const proposalBlock = document.getElementById("single-proposal-block");
	const proposalContent = document.getElementById("proposal-content");
	const optionsBlock = document.getElementById("options-block");
	const generalInfoBlock = document.getElementById("general-info");
	const resultsBlock = document.getElementById("results-block");
	const votersList = document.getElementById("voters-list");

	const errorBlockOptions = document.getElementById("error-block-options");
	const infoBlockOptions = document.getElementById("info-block-options");

	const loadingResultsBlock = document.getElementById("loading-results");
	const errorResultsBlock = document.getElementById("error-block-results");

	const loadingVotersBlock = document.getElementById("loading-voters");
	const errorVotersBlock = document.getElementById("error-block-voters");
	
	const proposalInfoResult = await checkValidProposalId();
	loadingBlock.classList.add("hidden");

	if(proposalInfoResult.success){
		proposalBlock.classList.remove("hidden");
		let isActive = true;
		const currentTimeToUtcTimestamp = toTimestamp(new Date().toUTCString());
		if (proposalInfoResult.data.endTime.seconds - currentTimeToUtcTimestamp <= 0){
			isActive = false;
		}

		proposalContent.innerHTML = `
			<p class="title">#${proposalInfoResult.data.proposalId} - ${proposalInfoResult.data.ipfsInfoDetails.name}</p>
			<div class="status-author">
				<div class="status">
					<span>Status:</span>
					<button ${!isActive ? 'class="completed"' : 'class="active"'}>
						${!isActive ? 'Completed' : 'Active'}
					</button>
				</div>
				<div class="author">
					<span>Created by:</span>
					<span>${formatWallet(proposalInfoResult.data.author, 8)}</span>
					<a class="copy" onclick="copyWallet('${proposalInfoResult.data.author}')">
						<i class="fa-solid fa-copy" ></i>
					</a>
				</div>
			</div>
			<p class="description">
				${proposalInfoResult.data.ipfsInfoDetails.description}
			</p>`;

		let optionsHtml = "";
		proposalInfoResult.data.ipfsInfoDetails.option.map((option, index) => {
			optionsHtml += `<li class="option-vote-btn" onclick="voteTransaction(${ proposalInfoResult.data.proposalId}, ${proposalInfoResult.data.organisationId}, ${index + 1})">${option}</li>`
		})

		if(isActive){
			optionsBlock.innerHTML = `
				<ul>
					${optionsHtml}
				</ul>
				<div id="info-block-vote" class="hidden info-block fs-15 pd-10 mb-10"></div>
				<div id="error-block-vote" class="hidden error-block fs-15 pd-10 mb-10"></div>
			`;
		} else {
			errorBlockOptions.classList.remove("hidden");
	        errorBlockOptions.innerHTML = "Proposal was ended."
		}

		generalInfoBlock.innerHTML = `
			<p class="title">Info</p>
			<ul>
				<li>
					<span>Organisation:</span>
					<span><a target="_blank" href="/organisation.html?id=${proposalInfoResult.data.organisationId}">#${proposalInfoResult.data.organisationId}</a></span>
				</li>
				<li>
					<span>Start date:</span>
					<span>${new Date(proposalInfoResult.data.startTime.seconds * 1000).toISOString().substr(0,16).replace("T", " ")} (UTC)</span>
				</li>
				<li>
					<span>End date:</span>
					<span>${new Date(proposalInfoResult.data.endTime.seconds * 1000).toISOString().substr(0,16).replace("T", " ")} (UTC)</span>
				</li>
				<li>
					<span>Metadata [IPFS]:</span>
					<span><a target="_blank" href="https://ipfs.infura.io/ipfs/${proposalInfoResult.data.infoIpfs}">${formatWallet(proposalInfoResult.data.infoIpfs, 5)}</a></span>
				</li>
			</ul>
		`;

		const proposalCurrentResults = await getProposalResults(proposalInfoResult.data.proposalId, proposalInfoResult.data.organisationId);
		loadingResultsBlock.classList.add("hidden");

		if(proposalCurrentResults.success){
			let totalVotes = 0;
			proposalCurrentResults.data.optionVotes.map((voteCount) =>{
				totalVotes += parseInt(voteCount);
			})
			let optionsBlockHtml = "";

			proposalCurrentResults.data.optionVotes.map((voteCount, index) =>{
				optionsBlockHtml += `
				<div class="option">
					<div>
						<span class="option-title">${proposalInfoResult.data.ipfsInfoDetails.option[index]}</span>
						<div>
							<span class="votes">${voteCount}</span>
							<span class="percent">${totalVotes == 0 ? "" : `[${ (voteCount / totalVotes * 100 ).toFixed(2) } %]`} </span>
						</div>
					</div>
					<div class="bars">
						<div class="bar bar1"></div>
						${totalVotes == 0 ? "" : `<div class="bar bar2" style="width: ${ (voteCount / totalVotes * 100 ).toFixed(2) }%;"></div>`}
						
					</div>
				</div>
				`;
			})

			resultsBlock.innerHTML = optionsBlockHtml;

			if(totalVotes == 0){
				loadingVotersBlock.classList.add("hidden");
				votersList.innerHTML = "No voters"
			} else {
				const votersResults = await getProposalVoters(proposalInfoResult.data.proposalId, proposalInfoResult.data.organisationId);
				loadingVotersBlock.classList.add("hidden");

				if(votersResults.success){
					let votersHtml = "";
					votersResults.data.voters.map((voter) =>{
						votersHtml += `
						<li>
							<span>${formatWallet(voter, 8)}</span>
							<a class="copy" onclick="copyWallet('${voter}')">
								<i class="fa-solid fa-copy"></i>
							</a>
						</li>
						`
					})
					votersList.innerHTML = votersHtml;
				} else {
			        errorVotersBlock.classList.remove("hidden");
			        errorVotersBlock.innerHTML = votersResults.error_message
			    }
			}
		} else {
	        errorResultsBlock.classList.remove("hidden");
	        errorResultsBlock.innerHTML = proposalCurrentResults.error_message
	    }
	} else {
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = proposalInfoResult.error_message
    }
}



init();