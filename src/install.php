<?php

if (Config::get('development_mode')) {

    if (Config::get('pdf') == null) {

        Config::save('pdf', [
            'templates' => '/pdf'
        ]);

    }

}