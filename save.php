<?php
/**
 * User: denis-takumi
 * Date: 29.04.2015
 * Time: 22:32
 */

if($_SERVER['REQUEST_METHOD'] == 'POST')
{
    file_put_contents(__DIR__.DIRECTORY_SEPARATOR.$_POST['track'].'.json');
    echo 'OK';
}