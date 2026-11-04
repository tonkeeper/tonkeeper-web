import { IStorage } from '../../Storage';
import { setChainKitSessionTokenProvider } from './chainKitClient';
import { DeviceAuthConfig, DeviceAuthService } from './deviceAuthService';
import { setMultichainAuthSession } from './multichainApiAuth';
import { NodesManifestService } from './nodesManifestService';

/**
 * One-call chain-kit wiring for a shell's boot path: installs the
 * device-auth session provider (so chain-kit authenticates its node
 * manifest and token-gated RPC nodes once a session exists), registers
 * the same session with the multichain REST auth layer, and starts the
 * node-manifest mirror whose origins feed the shell's CSP.
 *
 * Call once, right after the shell constructs its `AppSdk`, before
 * anything can touch a chain-kit mediator.
 */
export const initChainKit = (storage: IStorage, config: DeviceAuthConfig): NodesManifestService => {
    const auth = new DeviceAuthService(storage, config);
    setChainKitSessionTokenProvider(auth);
    setMultichainAuthSession(auth);
    const nodesManifest = new NodesManifestService(storage, auth);
    nodesManifest.start();
    return nodesManifest;
};
