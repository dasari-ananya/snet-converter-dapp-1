import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import upperCase from 'lodash/upperCase';
import { isValidShelleyAddress } from 'cardano-crypto.js';
import propTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { isNil } from 'lodash';
import store from 'store';
import useInjectableWalletHook from '../../libraries/useInjectableWalletHook';
import SnetDialog from '../snet-dialog';
import SnetBlockchainList from '../snet-blockchains-list';
import { useWalletHook } from '../snet-wallet-connector/walletHook';
import SnetButton from '../snet-button';
import { setWallets, removeFromAndToAddress } from '../../services/redux/slices/wallet/walletSlice';
import { availableBlockchains, externalLinks, supportedCardanoWallets } from '../../utils/ConverterConstants';
import SnetSnackbar from '../snet-snackbar';
import { useStyles } from './styles';

const SnetConnectWallet = ({ isDialogOpen, onDialogClose, blockchains }) => {
  const classes = useStyles();
  const [isAgreed, setIsAgreed] = useState(false);
  const [enableAgreeButton, setEnableAgreeButton] = useState(false);
  const [cardanoAddress, setCardanoAddress] = useState(null);
  const [isCardanoWalletExtensionAvailable, setIsCardanoWalletExtensionAvailable] = useState(true);
  const [error, setError] = useState({ showError: false, message: '' });
  const { address, disconnectEthereumWallet, connectEthereumWallet } = useWalletHook();
  const { connectWallet, getChangeAddress, detectCardanoInjectableWallets } = useInjectableWalletHook([supportedCardanoWallets.NAMI]);
  const state = useSelector((state) => state);

  const dispatch = useDispatch();

  const enableOrDisableAgreebutton = () => {
    const isCardanoAddressAvailable = !isNil(cardanoAddress);
    const isEthereumAddressAvailable = !isNil(address);

    const addressessAvailable = isCardanoAddressAvailable && isEthereumAddressAvailable;
    setEnableAgreeButton(addressessAvailable);
  };

  const getCardanoAddress = () => {
    try {
      const isCardanoWalletAvailable = detectCardanoInjectableWallets();
      setIsCardanoWalletExtensionAvailable(isCardanoWalletAvailable);

      if (!isCardanoWalletAvailable) {
        const cachedCardanoAddress = store.get(availableBlockchains.CARDANO) ?? null;
        setCardanoAddress(cachedCardanoAddress);
      }
    } catch (error) {
      console.log('Error on getCardanoAddress', error);
      throw new Error(error);
    }
  };

  useEffect(() => {
    getCardanoAddress();
  }, []);

  useEffect(() => {
    enableOrDisableAgreebutton();
  }, [cardanoAddress, address]);

  const openTermsAndConditions = () => {
    window.open(externalLinks.TERMS_AND_CONDITIONS, '_blank');
  };

  const getWalletAddress = (blockchain) => {
    const blockchainName = upperCase(blockchain);
    if (blockchainName === availableBlockchains.ETHEREUM) {
      return address;
    }
    if (blockchainName === availableBlockchains.CARDANO) {
      return cardanoAddress;
    }
    return null;
  };

  const getWalletPairs = () => {
    return {
      [availableBlockchains.ETHEREUM]: address,
      [availableBlockchains.CARDANO]: cardanoAddress
    };
  };

  const setWalletAddresses = () => {
    dispatch(setWallets(getWalletPairs()));
  };

  useEffect(() => {
    // Fetching wallet addresses from cache
    if (!isNil(address) && !isNil(cardanoAddress) && isAgreed) {
      setWalletAddresses();
    }
  }, [address, cardanoAddress]);

  const onSaveAddress = async (cardanoWalletAddress) => {
    // Saving Cardano address to cache

    const isValidCardanoWalletAddress = isValidShelleyAddress(cardanoWalletAddress);
    const cardanoAddressStartsWithExpectedPrefix = cardanoWalletAddress.startsWith(process.env.REACT_APP_CARDANO_ADDRESS_STARTS_WITH);

    if (isValidCardanoWalletAddress && cardanoAddressStartsWithExpectedPrefix) {
      setCardanoAddress(cardanoWalletAddress);
      await store.set(availableBlockchains.CARDANO, cardanoWalletAddress);
    } else {
      setError({ showError: true, message: 'Invalid Cardano wallet address' });
    }
  };

  const onClickDisconnectWallet = (blockchain) => {
    const blockchainName = upperCase(blockchain);
    if (blockchainName === availableBlockchains.ETHEREUM) {
      disconnectEthereumWallet();
    }
    if (blockchainName === availableBlockchains.CARDANO) {
      setCardanoAddress(null);
      store.remove(availableBlockchains.CARDANO);
    }

    dispatch(removeFromAndToAddress());
    dispatch(setWallets({}));
  };

  const getSignatureFromWallet = async () => {
    try {
      setIsAgreed(true);
      setWalletAddresses();
      onDialogClose();
    } catch (e) {
      const message = e.message.toString() ?? e.toString();
      setError({ showError: true, message });
    }
  };

  const closeError = () => {
    setError({ showError: false, message: '' });
  };

  const connectCardanoWallet = async () => {
    try {
      await connectWallet(supportedCardanoWallets.NAMI);
      const cardanoWalletAddress = await getChangeAddress();
      setCardanoAddress(cardanoWalletAddress);
    } catch (error) {
      console.error('Error connectCardanoWallet:', error);
    }
  };

  const connectWalletOptions = async (blockchain) => {
    try {
      const blockchainName = upperCase(blockchain);
      if (blockchainName === availableBlockchains.ETHEREUM) {
        connectEthereumWallet();
      }

      if (blockchainName === availableBlockchains.CARDANO) {
        await connectCardanoWallet();
      }
    } catch (error) {
      console.log('Error while connecting wallet', error);
      throw error;
    }
  };

  const checkExtensionAvailableByBlockchain = (blockchain) => {
    const blockchainName = upperCase(blockchain);
    if (blockchainName === availableBlockchains.ETHEREUM) {
      return true;
    }
    if (blockchainName === availableBlockchains.CARDANO) {
      return isCardanoWalletExtensionAvailable;
    }
    return false;
  };

  return (
    <>
      <SnetSnackbar open={error.showError} message={error.message} onClose={closeError} />
      <SnetDialog title="Connect Wallets" onDialogClose={onDialogClose} isDialogOpen={isDialogOpen}>
        <Box className={classes.connectWalletContent}>
          {blockchains.map((blockchain) => {
            return (
              <SnetBlockchainList
                key={blockchain.id}
                blockchain={blockchain.name}
                blockchainLogo={blockchain.logo}
                blockChainConnectInfo={blockchain.description}
                isWalletAvailable={checkExtensionAvailableByBlockchain(blockchain.name)}
                walletAddress={getWalletAddress(blockchain.name)}
                onSaveAddress={onSaveAddress}
                openWallet={() => connectWalletOptions(blockchain.name)}
                disconnectWallet={() => onClickDisconnectWallet(blockchain.name)}
                cardanoAddress={cardanoAddress}
              />
            );
          })}
        </Box>
        <Box className={classes.connectWalletActions}>
          <Box>
            <Typography>By connecting to the wallets, you agree to our</Typography>
            <Typography onClick={openTermsAndConditions} variant="caption">
              Terms & Conditions
            </Typography>
          </Box>
          <SnetButton onClick={getSignatureFromWallet} disabled={!enableAgreeButton} name="Agree" />
        </Box>
      </SnetDialog>
    </>
  );
};

SnetConnectWallet.propTypes = {
  isDialogOpen: propTypes.bool.isRequired,
  onDialogClose: propTypes.func.isRequired,
  blockchains: propTypes.arrayOf(propTypes.object)
};

export default SnetConnectWallet;
