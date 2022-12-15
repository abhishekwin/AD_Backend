const {launchpadTransferEventBsc} = require('./launchpad/transferEventBsc')
const {launchpadTransferEventEthereum} = require('./launchpad/transferEventEthereum')
const {createNftUsingCollectionFuncation} = require('./launchpad/launchPadCreateNftsUsingCollection')
const {failNftUsingCollectionFuncation} = require('./launchpad/launchPadFailNftsUsingCollection')


const createLaunchpadNfts = async () => {
    try {
        await createNftUsingCollectionFuncation();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }   
}

const failLaunchpadNfts = async () => {
    try {
        await failNftUsingCollectionFuncation();
    }
    catch (e) {
        // console.log("&&&&&&&&&&&&&&&&&&& sold ", e)
    }
}

async function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

async function cronRun(){
    createLaunchpadNfts(),
    failLaunchpadNfts()
    await sleep(10000)
    cronRun()
} 
cronRun()



