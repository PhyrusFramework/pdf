<?php

if (Config::get('project.development_mode')) {

    if (Config::get('pdf') == null) {

        Config::save('pdf', [
            'templates' => '/pdf'
        ]);

    }

}