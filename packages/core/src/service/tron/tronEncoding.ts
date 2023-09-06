import { RequestData } from '../../tronApi';
import { TronAddress, encodePackedBytes, encodeTronParams, keccak256 } from './tronUtils';

const DomainAbi = ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address', 'bytes32'];
const RequestAbi = [
    'bytes32',
    'address',
    'address',
    'uint256',
    'uint256',
    'uint32',
    'tuple(address,uint256,bytes)[]'
];

export function hashRequest(request: RequestData, contractAddress: string, chainId: string) {
    const REQUEST_TYPEHASH = keccak256(
        'Request(address feeReceiver,address feeToken,uint256 fee,uint256 deadline,uint32 nonce,Message[] messages)'
    );
    const structHash = keccak256(
        encodeTronParams(RequestAbi, [
            REQUEST_TYPEHASH,
            request.feeReceiver,
            request.feeToken,
            request.fee,
            request.deadline,
            request.nonce,
            request.messages.map(m => [
                '0x' + TronAddress.base58ToHex(m.to).slice(2),
                m.value,
                m.data
            ])
        ])
    );

    const domain = domainHash(contractAddress, chainId);

    return keccak256(encodePackedBytes(['0x1901', domain, structHash]));
}

function domainHash(contractAddress: string, chainId: string) {
    const TIP712_DOMAIN_TYPEHASH = keccak256(
        'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)'
    );
    const NAME = keccak256('TONKEEPER');
    const VERSION = keccak256('1');
    const SALT = keccak256('TRON_WALLET');
    return keccak256(
        encodeTronParams(DomainAbi, [
            TIP712_DOMAIN_TYPEHASH,
            NAME,
            VERSION,
            chainId,
            contractAddress,
            SALT
        ])
    );
}
