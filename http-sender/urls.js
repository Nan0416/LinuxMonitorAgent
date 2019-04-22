
domain_ = "";
rest_prefix_ = "";
module.exports.set_domain = (domain) => {domain_ = domain;}
module.exports.set_rest_prefix = (rest_prefix) => {rest_prefix_ = rest_prefix;}
module.exports.get_terminate_monitoring_url = () => `${domain_}${rest_prefix_}/terminate`;
module.exports.get_verify_private_key_url = () => `${domain_}${rest_prefix_}/verifykey`;