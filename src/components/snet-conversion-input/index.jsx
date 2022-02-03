import { useState } from 'react';
import { Stack, Typography } from '@mui/material';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import propTypes from 'prop-types';
import BlockchainDropdown from './BlockchainDropdown';
import InputWithAssetDropdown from './InputWithAssetDropdown';
import { styles } from './styles';

const SnetConversionOptions = ({ direction, blockchains }) => {
  const [selectedBlockchain, setSelectedBlockchain] = useState([blockchains]);
  const [blockchainTokenPairs, setBlockchainTokenpairs] = useState([]);

  const onSelectBlockchain = (event) => {
    const blockchain = event.target.value;
    setSelectedBlockchain(blockchain);
    setBlockchainTokenpairs(blockchain.pairs);
  };

  return (
    <>
      <Stack spacing={1} direction="row" alignItems="center" marginBottom={2} justifyContent="space-between">
        <Stack spacing={1} direction="row" alignItems="center">
          <Typography variant="body2">{direction}</Typography>
          {blockchains ? <BlockchainDropdown value={selectedBlockchain} handleSelect={onSelectBlockchain} tokens={blockchains} /> : null}
        </Stack>
        <Stack spacing={1} direction="row" alignItems="center">
          <WalletIcon color="grey" sx={styles.walletIconSize} />
          <Typography sx={styles.walletNotSelected}>Wallet Not Selected</Typography>
        </Stack>
      </Stack>
      <InputWithAssetDropdown tokenPairs={blockchainTokenPairs} />
    </>
  );
};

SnetConversionOptions.propTypes = {
  direction: propTypes.string.isRequired,
  blockchains: propTypes.arrayOf(propTypes.object)
};

SnetConversionOptions.defaultProps = {
  blockchains: []
};

export default SnetConversionOptions;
