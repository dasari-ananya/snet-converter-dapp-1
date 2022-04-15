import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import WarningIcon from '@mui/icons-material/Warning';
import SuccessIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import propTypes from 'prop-types';
import CardActions from '@mui/material/CardActions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { utcToLocalDateTime } from '../../utils/Date';
import Transactions from './Transactions';
import { conversionStatuses, conversionDirections, conversionStatusMessages } from '../../utils/ConverterConstants';
import { useStyles } from './styles';
import SnetButton from '../snet-button';

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest
  })
}));

const Rows = ({
  id,
  date,
  fromToken,
  toToken,
  depositAmount,
  receivingAmount,
  fromAddress,
  toAddress,
  chainType,
  status,
  transactions,
  conversionDirection,
  handleResume
}) => {
  const [expanded, setExpanded] = useState(false);
  const classes = useStyles();

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const transactionStatus = (status) => {
    let component;
    switch (status) {
      case conversionStatuses.PROCESSING ||
        conversionStatuses.USER_INITIATED ||
        conversionStatuses.CLAIM_INITIATED ||
        conversionStatuses.WAITING_FOR_CONFIRMATION ||
        conversionStatuses.WAITING_FOR_CLAIM ||
        conversionStatuses.IDLE:
        component = <HourglassBottomIcon fontSize="small" color="primary" />;
        break;

      case conversionStatuses.SUCCESS:
        component = <SuccessIcon fontSize="small" color="success" />;
        break;

      default:
        component = <WarningIcon fontSize="small" color="warning" />;
        break;
    }
    return component;
  };

  const copyToClipboard = async (str) => {
    await navigator.clipboard.writeText(str);
  };

  const addEllipsisInBetweenString = (str) => {
    if (str.length) {
      return `${str.substr(0, 4)}...${str.substr(str.length - 4)}`;
    }
    return str;
  };

  const shrinkId = (str) => {
    if (id.length) {
      return `${str.substr(0, 18)}...`;
    }
    return str;
  };

  return (
    <>
      <Grid container spacing={2} className={`${classes.transactionDataRow} ${expanded ? classes.expandedRow : ''}`}>
        <Grid item xs={6} md={2}>
          <Tooltip title={id}>
            <Typography overflow="hidden" textOverflow="ellipsis" align="left" className={classes.id}>
              {shrinkId(id)}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography textTransform="uppercase" align="left">
            {utcToLocalDateTime(date)}
          </Typography>
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography textTransform="uppercase" align="left">
            {chainType}
          </Typography>
        </Grid>
        <Grid item xs={6} md={1} flexDirection="column" className={classes.alignRight}>
          <Typography textTransform="uppercase" align="right">
            {depositAmount} {fromToken}
          </Typography>
          <Button type="button" className={classes.fromToAddressContainer} onClick={() => copyToClipboard(fromAddress)}>
            <Typography textTransform="lowercase">{addEllipsisInBetweenString(fromAddress)}</Typography>
            <ContentCopyIcon />
          </Button>
        </Grid>
        <Grid item xs={6} md={1} flexDirection="column" className={classes.alignRight}>
          <Typography textTransform="uppercase" align="right">
            {receivingAmount} {toToken}
          </Typography>
          <Button type="button" className={classes.fromToAddressContainer} onClick={() => copyToClipboard(toAddress)}>
            <Typography textTransform="lowercase">{addEllipsisInBetweenString(toAddress)}</Typography>
            <ContentCopyIcon />
          </Button>
        </Grid>
        <Grid item xs={6} md={2} className={classes.statusData}>
          <div className={classes.statusValueContainer}>
            {transactionStatus(status)}
            <Typography data-status-type={status} className={classes.value} align="center">
              {conversionStatusMessages[status]}
            </Typography>
          </div>
        </Grid>
        <Grid item xs={6} md={2} className={classes.expandArrowContainer} justifyContent="flex-end">
          {conversionDirection === conversionDirections.ADA_TO_ETH && status === conversionStatuses.USER_INITIATED ? (
            <SnetButton name="View" onClick={handleResume} variant="outlined" />
          ) : null}
          {status === conversionStatuses.WAITING_FOR_CLAIM ? <SnetButton name="Continue" onClick={handleResume} variant="outlined" /> : null}
          <CardActions disableSpacing>
            {transactions.length > 0 ? (
              <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
                <ExpandMoreIcon />
              </ExpandMore>
            ) : null}
          </CardActions>
        </Grid>
      </Grid>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box display="flex" justifyContent="space-between" className={classes.expandedData}>
          <div className={classes.expandedDataWrapper}>
            <Grid container className={classes.expandedDataCol}>
              <Grid item xs={6} md={2}>
                <Typography>Date</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography>Process Status</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography>Status</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography>Transaction</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography>Detail</Typography>
              </Grid>
            </Grid>
            {transactions.map((transaction) => {
              return (
                <Grid key={transaction.id} container className={classes.expandedDataRows}>
                  <Transactions transaction={transaction} conversionDirection={conversionDirection} />
                </Grid>
              );
            })}
          </div>
        </Box>
      </Collapse>
    </>
  );
};

Rows.propTypes = {
  id: propTypes.string.isRequired,
  date: propTypes.string.isRequired,
  fromToken: propTypes.string.isRequired,
  toToken: propTypes.string.isRequired,
  fromAddress: propTypes.string.isRequired,
  toAddress: propTypes.string.isRequired,
  chainType: propTypes.string.isRequired,
  status: propTypes.string.isRequired,
  transactions: propTypes.arrayOf(propTypes.any).isRequired,
  conversionDirection: propTypes.string.isRequired,
  handleResume: propTypes.func.isRequired,
  depositAmount: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired,
  receivingAmount: propTypes.oneOfType([propTypes.string, propTypes.number]).isRequired
};

export default Rows;
