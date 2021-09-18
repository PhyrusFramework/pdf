<?php

if (Config::get('development_mode')) {

    if (Config::get('templates') == null) {

        Config::save('templates', [
            'pdf' => '/pdf'
        ]);

    } else {

        $t = Config::get('templates');
        $t['pdf'] = '/pdf';
        Config::save('templates', $t);

    }

}