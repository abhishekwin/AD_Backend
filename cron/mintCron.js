const {launchpadTransferEventBsc} = require('./launchpad/transferEventBsc')
const {launchpadTransferEventEthereum} = require('./launchpad/transferEventEthereum')


const createLaunchpadNfts = async () => {
    console.log("-----create nft start-----")
    try {
        await createNftUsingCollectionFuncation();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    createLaunchpadNfts()
}

const failLaunchpadNfts = async () => {
    console.log("-----fail nft start------")
    try {
        await failNftUsingCollectionFuncation();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    failLaunchpadNfts()
}


const bscMint = async () => {
    console.log("cron bsc")
    try {
        await launchpadTransferEventBsc();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    bscMint()
}

const ethMint = async () => {
    console.log("cron eth")
    try {
        await launchpadTransferEventEthereum();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
    ethMint()
}


createLaunchpadNfts()
failLaunchpadNfts()
bscMint()
ethMint()


