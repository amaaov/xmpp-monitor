<?php
  $result = array("status"=>"no-action");

  # Get arguments
  if (isset($_GET['add'])) $host_to_add = $_GET['add'];
  if (isset($_POST['add'])) $host_to_add = $_POST['add'];

  function is_valid_domain_name($string) {
    return (preg_match("/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i", $string) # Valid chars check
            && preg_match("/^.{1,253}$/", $string) # Overall length check
            && preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $string)); # Length of each label
  }

  # Filter wrong hosts
  function add_host($hostname='') {
    $status = "no-add-host";
    if (is_valid_domain_name($hostname)) {
      # Resolve IP
      //if(filter_var(gethostbyname($hostname), FILTER_VALIDATE_IP)) {
      if (checkdnsrr($hostname)) {
        $file = file_get_contents('hosts_pending.json');
        $data = json_decode($file);
        unset($file);
        if(!in_array($hostname,$data)) {
          # Insert data here
          $data[] = $hostname;
          # Save the file
          file_put_contents('hosts_pending.json',json_encode($data));
          file_put_contents('hosts.log', $hostname."\n", FILE_APPEND);
          $status = "add-host";
        } else $status = "in-array";
        unset($data);
      } else $status = "not-valid";
    } else $status = "not-valid";
    return $status;
  }

  if (isset($host_to_add)) $result = array("status"=>add_host($host_to_add));

  echo json_encode($result);
?>
