async function checkValidOrganisationId(){
	const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let organisationId = null;

    if(urlParams.has('id')) {
        organisationId = parseInt(urlParams.get('id'));
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

async function getAllProposals(){
	const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const organisationId = parseInt(urlParams.get('id'));
    const aelf = new AElf(new AElf.providers.HttpProvider(chainEndpoint));
    const wallet = AElf.wallet.createNewWallet();

    try{
        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
        try {
            const result = await contractInstance.GetOrganisationProposalCount.call({value: organisationId});
            const promises = [];
            const promises2 = [];
            try {
	            for(var i = 1; i <= parseInt(result.value); i++){
	                promises.push(contractInstance.GetProposalInfo.call({organisationId: organisationId, proposalId: i}))
	            }

	            let proposalsInfoTemp = await Promise.allSettled(promises);
	            const proposalsInfo = [];

	            for(var i = 0; i < proposalsInfoTemp.length; i ++){
	                if(proposalsInfoTemp[i].status == "fulfilled"){
	                    proposalsInfo.push(proposalsInfoTemp[i].value)
	                } 
	            }

	            for(var i = 0; i < proposalsInfo.length; i ++){
	                promises2.push(fetch("https://ipfs.infura.io/ipfs/" + proposalsInfo[i].infoIpfs))
	            }

	            let ipfsInfoTemp = await Promise.allSettled(promises2);

	            for(var i = 0; i < ipfsInfoTemp.length; i ++){
	                if(ipfsInfoTemp[i].status == "fulfilled" && ipfsInfoTemp[i].value.status == 200){
	                    try{
	                        const ipfsResult = await ipfsInfoTemp[i].value.json();
	                        proposalsInfo[i].ipfsInfoDetails = ipfsResult;
	                    } catch (e){
	                        proposalsInfo[i].ipfsInfoDetails = null;
	                    }
	                } else {
	                    proposalsInfo[i].ipfsInfoDetails = null;
	                }
	            }
	            return {
	                success: true,
	                error_message: null,
	                data: proposalsInfo
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
                error_message: "An error has occurred (GetOrganisationProposalCount)",
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


async function getAllMembers(){
	const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const organisationId = parseInt(urlParams.get('id'));
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


async function checkMemberWallet(memberWallet, organisationCreator){
	try{
		if(!userLogin){
			return {
	            success: false,
	            error_message: "Please connect wallet",
	        }
		}
		if(walletAddress.toLowerCase() != organisationCreator.trim().toLowerCase()){
			return {
	            success: false,
	            error_message: "You are not the creator of this organisation",
	        }
		}
		if(!memberWallet.trim()){
			return {
	            success: false,
	            error_message: "Please put a wallet address.",
	        }
		}
		try {
			AElf.utils.base58.decode(memberWallet.trim());
		} catch(e){
	        return {
	            success: false,
	            error_message: "Please put a correct wallet address.",
	        }
	    } 
	    try {
	    	const membersResult = await getAllMembers();
			if(membersResult.success){
				for(var i = 0; i < membersResult.data.members.length; i++){
					if(membersResult.data.members[i].toLowerCase() == memberWallet.trim().toLowerCase()){
						return {
				            success: false,
				            error_message: "This member already exists.",
				        }
					}
				}
				return {
		            success: true,
		            error_message: null,
		        }
		    } else {
		    	return {
		            success: false,
		            error_message: "Get members error.",
		        }
		    }
		} catch(e) {
			return {
	            success: false,
	            error_message: "Get members error.",
	        }
	    }
	} catch(e){
        return {
            success: false,
            error_message: "Error...",
        }
    } 
}


async function addMember(memberWallet, organisationId) {
 	try {
 		const connection = await aelf.chain.getChainStatus();
	    try{
	    	const wallet = {
	            address: walletAddress
	        };
	        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
	        try {
	        	const result = await contractInstance.AddMemberToOrganisation({
			        id: organisationId,
			        member: memberWallet
			    })
			    return {
		            success: true,
		            error_message: null,
		            data: result.result.TransactionId
		        }
	        } catch(e){
	        	return {
		            success: false,
		            error_message: "An error has occurred (AddMemberToOrganisation)",
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


async function checkBeforeRemoveMember(memberWallet, organisationId, organisationCreator) {
	const errorRemoveMemberBlock = document.getElementById("error-remove-member");
	const infoRemoveMemberBlock = document.getElementById("info-remove-member");

	infoRemoveMemberBlock.classList.remove("hidden")
	errorRemoveMemberBlock.classList.add("hidden");

	let checkError = null;
	try{
		if(!userLogin){
			checkError = "Please connect wallet";
		}
		if(walletAddress.toLowerCase() != organisationCreator.trim().toLowerCase()){
			checkError = "You are not the creator of this organisation";
		}
		try {
			AElf.utils.base58.decode(memberWallet.trim());
		} catch(e){
			checkError = "Please put a correct wallet address.";
	    } 
	    try {
	    	const membersResult = await getAllMembers();
			if(membersResult.success){
				let exist = false;
				for(var i = 0; i < membersResult.data.members.length; i++){
					if(membersResult.data.members[i].toLowerCase() == memberWallet.trim().toLowerCase()){
						exist = true;
						break
					}
				}
				if(!exist){
					checkError = "This member does not exist.";
				}
		    } else {
		    	checkError = "Get members error.";
		    }
		} catch(e) {
			checkError = "Get members error."
	    }
	} catch(e){
		checkError = "Error...";
		checkError = e;
    } 

    if(checkError){
    	errorRemoveMemberBlock.innerHTML = `Error: ${checkError}`;
		errorRemoveMemberBlock.classList.remove("hidden")
		infoRemoveMemberBlock.classList.add("hidden");
		return
    }




	infoRemoveMemberBlock.innerHTML = `Please confirm transaction`;
	const transactionResult = await removeMember(memberWallet, organisationId);
	
	if(transactionResult.success){
		infoRemoveMemberBlock.innerHTML = `Transaction hash: ${transactionResult.data}. <br><br> Status: <span id="txStatusSpan">fetching...</span>`;
		const transactionStatusResult = await checkTransactionStatus(transactionResult.data);
		if(transactionStatusResult.success){
			infoRemoveMemberBlock.classList.remove("hidden");
			document.getElementById("txStatusSpan").innerHTML = transactionStatusResult.data;
		} else {
			infoRemoveMemberBlock.classList.add("hidden");
			errorRemoveMemberBlock.classList.remove("hidden");
			errorRemoveMemberBlock.innerHTML = transactionStatusResult.error_message;
		}
	} else{
		infoRemoveMemberBlock.classList.add("hidden");
		errorRemoveMemberBlock.classList.remove("hidden");
		errorRemoveMemberBlock.innerHTML = transactionResult.error_message;
	}
	


}



async function removeMember(memberWallet, organisationId) {
 	try {
 		const connection = await aelf.chain.getChainStatus();
	    try{
	    	const wallet = {
	            address: walletAddress
	        };
	        const contractInstance = await aelf.chain.contractAt(contractAddress, wallet);
	        try {
	        	const result = await contractInstance.RemoveMemberFromOrganisation({
			        id: organisationId,
			        member: memberWallet
			    })
			    return {
		            success: true,
		            error_message: null,
		            data: result.result.TransactionId
		        }
	        } catch(e){
	        	return {
		            success: false,
		            error_message: "An error has occurred (RemoveMemberFromOrganisation)",
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
	const loadingBlock = document.getElementById("loading");
	const loadingProposalsBlock = document.getElementById("loading-proposals");
	const loadingMembersBlock = document.getElementById("loading-members");
	const errorBlock = document.getElementById("error-block");
	const errorBlockProposals = document.getElementById("error-block-proposals");
	const errorBlockMembers = document.getElementById("error-block-members");

	const organisationBlock = document.getElementById("single-organisation");
	const organisationinfoAddMemberBlock = document.getElementById("single-organisation-top-block");

	const proposalsBtn = document.getElementById("proposals-btn");
	const membersBtn = document.getElementById("members-btn");

	const createProposalBtn = document.getElementById("create-proposal-btn");
	
	const proposalsListBlock = document.getElementById("proposals-list-block");
	const proposalsList = document.getElementById("proposals-list");

	const membersListBlock = document.getElementById("members-list-block");
	const membersList = document.getElementById("members-list-ul");
	const addMemberBtn = document.getElementById("add-member-btn");

	proposalsBtn.addEventListener("click", ()=>{
		membersBtn.classList.remove("active");
		membersListBlock.classList.add("hidden");
		proposalsBtn.classList.add("active");
		proposalsListBlock.classList.remove("hidden");
	})

	membersBtn.addEventListener("click", ()=>{
		proposalsBtn.classList.remove("active");
		proposalsListBlock.classList.add("hidden");
		membersBtn.classList.add("active");
		membersListBlock.classList.remove("hidden");
	})

	const checkResult = await checkValidOrganisationId();
	loadingBlock.classList.add("hidden");

	if(checkResult.success){
		createProposalBtn.setAttribute("href", `/create-proposal.html?organisation=${checkResult.data.id}`)
		organisationBlock.classList.remove("hidden");
		organisationinfoAddMemberBlock.innerHTML = `
			<div class="organisation-logo" style="background-image: url(${!checkResult.data.isVerified ? '/src/images/notVerified.png' : checkResult.data.ipfsInfo.logo ? `https://ipfs.infura.io/ipfs/${checkResult.data.ipfsInfo.logo}` : '/src/images/noOrganisationImage.png'});"></div>
			<div class="organisation-title">
				<span>${checkResult.data.name}</span>
				<img ${checkResult.data.isVerified ? '' : 'class="hidden"'} src="./src/images/icons/verified.svg" alt="Verified" title="Verified">
			</div>
			<div class="organisation-description">
				<div class="links">
					${checkResult.data.ipfsInfo.website ? `<a target="_blank" href="${checkResult.data.ipfsInfo.website}" class="link"> <img src="./src/images/icons/website.svg" alt="twitter"> </a>` : ''}
					${checkResult.data.ipfsInfo.twitter ? `<a target="_blank" href="${checkResult.data.ipfsInfo.twitter}" class="link"> <img src="./src/images/icons/twitter.svg" alt="twitter"> </a>` : ''}
					${checkResult.data.ipfsInfo.discord ? `<a target="_blank" href="${checkResult.data.ipfsInfo.discord}" class="link"> <img src="./src/images/icons/discord.svg" alt="twitter"> </a>` : ''}
					${checkResult.data.ipfsInfo.telegram ? `<a target="_blank" href="${checkResult.data.ipfsInfo.telegram}" class="link"> <img src="./src/images/icons/telegram.svg" alt="twitter"> </a>` : ''}
				</div>
				${checkResult.data.ipfsInfo.description ? `<span>${checkResult.data.ipfsInfo.description}</span>` : ''}
			</div>
		`;

		const organisationCreator = checkResult.data.creator;
		const organisationId = checkResult.data.id;
		addMemberBtn.addEventListener("click", async ()=>{
			const memberWalletInput = document.getElementById("member-wallet");
			const errorAddMemberBlock = document.getElementById("error-add-member");
			const infoAddMemberBlock = document.getElementById("info-add-member");

			memberWalletInput.classList.remove("error");
			infoAddMemberBlock.classList.remove("hidden")
			errorAddMemberBlock.classList.add("hidden");
			const checkWalletResult = await checkMemberWallet(memberWalletInput.value, organisationCreator);

			if(checkWalletResult.success == true) {
				infoAddMemberBlock.innerHTML = `Please confirm transaction`;
				const transactionResult = await addMember(memberWalletInput.value, organisationId);
				
				if(transactionResult.success){
					infoAddMemberBlock.innerHTML = `Transaction hash: ${transactionResult.data}. <br><br> Status: <span id="txStatusSpan">fetching...</span>`;
					const transactionStatusResult = await checkTransactionStatus(transactionResult.data);
					if(transactionStatusResult.success){
						infoAddMemberBlock.classList.remove("hidden");
						document.getElementById("txStatusSpan").innerHTML = transactionStatusResult.data;
					} else {
						infoAddMemberBlock.classList.add("hidden");
						errorAddMemberBlock.classList.remove("hidden");
						errorAddMemberBlock.innerHTML = transactionStatusResult.error_message;
					}
				} else{
					infoAddMemberBlock.classList.add("hidden");
					errorAddMemberBlock.classList.remove("hidden");
					errorAddMemberBlock.innerHTML = transactionResult.error_message;
				}
			} else {
				memberWalletInput.focus();
				memberWalletInput.classList.add("error");
				errorAddMemberBlock.innerHTML = `Error: ${checkWalletResult.error_message}`;
				errorAddMemberBlock.classList.remove("hidden")
				infoAddMemberBlock.classList.add("hidden")
			}
		})

		const proposalsResult = await getAllProposals();
		loadingProposalsBlock.classList.add("hidden");

		if(proposalsResult.success){
			proposalsList.classList.remove("hidden");
			proposalsList.innerHTML = "";

			if(proposalsResult.data.length == 0){
	            proposalsList.style.textAlign = "center";
	            proposalsList.style.fontSize = "18px";
	            proposalsList.innerHTML = "No proposals ...";
	        }
	        else {
		        proposalsResult.data.map((proposalInfo) => {
		        	let isActive = true;
					const currentTimeToUtcTimestamp = toTimestamp(new Date().toUTCString());
					if (proposalInfo.endTime.seconds - currentTimeToUtcTimestamp <= 0){
						isActive = false;
					}

		            proposalsList.innerHTML += `
		            	<a href="./proposal.html?id=${proposalInfo.organisationId}_${proposalInfo.proposalId}">
							<div class="proposal-card">
								<button ${!isActive ? 'class="completed"' : 'class="active"'}>
									${!isActive? 'Completed' : 'Active'}
								</button>
								<p class="title">#${proposalInfo.proposalId} - ${proposalInfo.ipfsInfoDetails.name}</p>
								<p class="description">${shortText(proposalInfo.ipfsInfoDetails.description, 100)}</p>
								${!isActive
									? ''
									: `<div class="expiration-date">
										<span>Expiration date (UTC):</span>
										<span>${new Date(proposalInfo.endTime.seconds * 1000).toISOString().substr(0,16).replace("T", " ")}</span>
									</div>`
								}
								<div class="author">
									<span>Created by:</span>
									<span>${formatWallet(proposalInfo.author, 8)}</span>
								</div>
							</div>
						</a>
		            `
		        })
		    }
		} else {
	        errorBlockProposals.classList.remove("hidden");
	        errorBlockProposals.innerHTML = proposalsResult.error_message
	    }

	    const membersResult = await getAllMembers();
	    loadingMembersBlock.classList.add("hidden");

		if(membersResult.success){
			membersList.classList.remove("hidden");
			if(membersResult.data.members.length == 1){
				membersList.innerHTML = `
					<p class="title">Admin:</p>
					<ul>
						<li>
							<span>${formatWallet(checkResult.data.creator, 8)}</span>
							<a class="copy" onclick="copyWallet('${checkResult.data.creator}')">
								<i class="fa-solid fa-copy"></i>
							</a>
						</li>
					</ul>
					<p class="title">Members:</p>
					<ul>
						<li>
							No members
						</li>
					</ul>`;
	            return;
	        }

	        let membersListHtml = "";
	        membersResult.data.members.map((member) => {
				if(member.toLowerCase() != checkResult.data.creator.toLowerCase()){
					membersListHtml += `
						<li>
							<span>${formatWallet(member, 8)}</span>
							<a class="copy" onclick="copyWallet('${member}')">
								<i class="fa-solid fa-copy"></i>
							</a>
							${walletAddress == checkResult.data.creator ? `<a class="remove" onclick="checkBeforeRemoveMember('${member}', '${organisationId}', '${organisationCreator}')"><i class="fa-solid fa-trash"></i></a>` : ''}
							
						</li>`
				}
			})

	        membersList.innerHTML = `
				<p class="title">Admin:</p>
				<ul>
					<li>
						<span>${formatWallet(checkResult.data.creator, 8)}</span>
						<a class="copy" onclick="copyWallet('${checkResult.data.creator}')">
							<i class="fa-solid fa-copy"></i>
						</a>
					</li>
				</ul>
				<p class="title">Members:</p>
				<ul>
					${membersListHtml}
				</ul>`;
		} else {
	        errorBlockMembers.classList.remove("hidden");
	        errorBlockMembers.innerHTML = membersResult.error_message
	    }
	} else {
        errorBlock.classList.remove("hidden");
        errorBlock.innerHTML = checkResult.error_message
    }
}


init();