import { BytesLike, concat, dataSlice, getAddress, getBytes, keccak256 } from 'ethers';
import { TronAddress } from './tronUtils';

const base58AddressToEth = (address: string) => {
    return '0x' + TronAddress.base58ToHex(address).slice(2);
};

const addressToSalt = (address: string) => {
    return '0x' + '0'.repeat(24) + base58AddressToEth(address).slice(2);
};

const buildBytecodeHash = (implementationAddress: string) => {
    return keccak256(
        concat([
            '0x3d602d80600a3d3981f3363d3d373d3d3d363d73',
            base58AddressToEth(implementationAddress),
            '0x5af43d82803e903d91602b57fd5bf3'
        ])
    );
};

function getCreate2Address(_from: string, _salt: BytesLike, _initCodeHash: BytesLike): string {
    const from = getAddress(_from);
    const salt = getBytes(_salt, 'salt');
    const initCodeHash = getBytes(_initCodeHash, 'initCodeHash');

    return dataSlice(keccak256(concat(['0x41', from, salt, initCodeHash])), 12);
}

export const calculateCreate2 = ({
    factoryAddress,
    ownerAddress,
    implementationAddress
}: {
    factoryAddress: string;
    implementationAddress: string;
    ownerAddress: string;
}) => {
    const byteCode = buildBytecodeHash(implementationAddress);
    const saltHex = addressToSalt(ownerAddress);

    const predictedAddress = getCreate2Address(
        base58AddressToEth(factoryAddress),
        saltHex,
        byteCode
    );
    return TronAddress.hexToBase58(predictedAddress);
};
