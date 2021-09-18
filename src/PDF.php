<?php

use Dompdf\Dompdf;

class PDF {

    /**
     * Import Javascript libraries to generate a PDF from Front-End.
     */
    public static function useSDK() {
        Head::add(function() {
            $rel = Path::toRelative(__DIR__) . '/assets';?>
            <script src="<?= $rel ?>/html2canvas.min.js" async defer></script>
            <script src="<?= $rel ?>/jspdf.umd.min.js" async defer></script>
            <script src="<?= $rel ?>/pdf.js" async defer></script>
            <?php
        });
    }

    /**
     * Directory where templates are located.
     * 
     * @return string
     */
    private static function templatesDir() : string {
        $check = Config::get('templates.pdf');
        if (empty($check)) {
            Config::save('templates.pdf', '/pdf');
            Folder::instance(Path::project() . '/pdf')->create();
            return '/pdf';
        }
        return $check;
    }

    /**
     * PDF Object
     * 
     * @var Dompdf
     */
    private Dompdf $pdf;

    /**
     * Paper size [Default A4]
     * 
    * @var string $paperSize A1|A2|A3|A4|A5
     */
    private string $paperSize = 'A4';

    /**
     * Document orientation [Default portrait]
     * 
     * @var string $orientation portrait|landscape
     */
    private string $orientation = 'portrait';

    function __construct(){
        $this->pdf = new Dompdf();
    }

    /**
     * Set the paper size, from 1 to 5
     * 
     * @param int $size
     */
    function paperSize(int $size) {
        $this->paperSize = "A$size";
        $this->pdf->setPaper($this->paperSize, $this->orientation);
    }

    /**
     * Set the document orientation to landscape
     */
    function landscape() {
        $this->orientation = 'landscape';
        $this->pdf->setPaper($this->paperSize, $this->orientation);
    }

    /**
     * Write HTML into the document.
     * 
     * @param string $html
     */
    function writeHTML(string $html) {
        $this->pdf->loadHtml($html);
    }

    /**
     * Write text into the document.
     * 
     * @param string $text
     */
    function write(string $text) {
        $this->pdf->loadHtml(str_replace("\n", '<br>', $text));
    }

    /**
     * Display the document in the current page.
     * 
     * @param string $name [Default document] Browser tab title.
     */
    function display(string $name = 'document'){
        $this->pdf->render();
        $this->pdf->stream("$name.pdf", ['Attachment' => false]);
        exit(0);
    }

    /**
     * Make the user download the pdf document.
     * 
     * @param string $name [Default document] Document name
     */
    function download(string $name = 'document') {
        $this->pdf->render();
        $this->pdf->stream("$name.pdf");
    }

    /**
     * Save PDF to a file.
     * 
     * @param string $filename
     */
    function saveToFile(string $filename) {
        $dir = dirname($filename);
        if (!is_dir($dir))
            mkdir($dir);
        $output = $this->pdf->output();
        file_put_contents($filename, $output);
    }

    /**
     * Load a PDF template with variables.
     * 
     * @param string $template Template name.
     * @param array $variables [Default empty]
     */
    function loadTemplate(string $template, array $variables = []) {
        $path = Path::project() . self::templatesDir();
        $file = $path . "/$template";
        if (!file_exists($file)) return;

        $c = file_get_contents($file);
        $this->writeHTML($this->generateContent($c, $variables));
    }

    /**
     * Place variables into string
     * 
     * @param string $content
     * @param array $variables [Default empty]
     */
    private function generateContent(string $content, array $variables = []) {
        $aux = '';
        $in = false;
        $last = '';
        $current = '';
        for($i = 0; $i<strlen($content); ++$i) {

            $ch = $content[$i];

            if ($current == '{' && $last == '{') {
                $in = true;
                $last = '';
            }
            else if ($current == '}' && $last == '}') {
                $in = false;

                $tr = trim($current);
                if (isset($variables[$tr]))
                    $aux .= $variables[$tr];
                else
                    $aux .= "{{$current}}";

                $current = false;
                $last = '';
            }
            else if ($in) {
                $current .= $last;
                $last = $ch;
            }
            else {
                $aux .= $last;
                $last = $ch;
            }

        }
        $aux .= $last;

        return $aux;
    }

    /**
     * Display a PDF from a File. This must be done before any output.
     * In a controller, use inside of the prepare method instead of display.
     * 
     * @param string $path
     * @param string? $filename
     */
    public static function displayFile(string $path, $filename = 'document') {
        header("Content-type: application/pdf");
        header("Content-Disposition: inline; filename=$filename.pdf");
        @readfile($path);
    }

}