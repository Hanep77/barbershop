<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        self::ensureTestKeys();
        parent::setUp();
    }

    /**
     * Test key material is generated on demand and never committed.
     * phpunit.xml points at infrastructure/keys/test.
     */
    private static function ensureTestKeys(): void
    {
        $dir = dirname(__DIR__, 3).DIRECTORY_SEPARATOR.'infrastructure'
            .DIRECTORY_SEPARATOR.'keys'.DIRECTORY_SEPARATOR.'test';
        $privatePath = $dir.DIRECTORY_SEPARATOR.'jwt-private.pem';
        $publicPath = $dir.DIRECTORY_SEPARATOR.'jwt-public.pem';

        if (is_file($privatePath) && is_file($publicPath)) {
            return;
        }

        if (! is_dir($dir) && ! @mkdir($dir, 0777, true) && ! is_dir($dir)) {
            return;
        }

        if (self::generateWithPhp($privatePath, $publicPath)) {
            return;
        }

        self::generateWithCli($privatePath, $publicPath);
    }

    private static function generateWithPhp(string $privatePath, string $publicPath): bool
    {
        if (! function_exists('openssl_pkey_new')) {
            return false;
        }

        $resource = @openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);

        if ($resource === false) {
            return false;
        }

        $privatePem = '';
        @openssl_pkey_export($resource, $privatePem);
        $details = openssl_pkey_get_details($resource);

        if ($privatePem === '' || ! is_array($details) || ! isset($details['key'])) {
            return false;
        }

        file_put_contents($privatePath, $privatePem);
        file_put_contents($publicPath, $details['key']);
        @chmod($privatePath, 0600);

        return true;
    }

    private static function generateWithCli(string $privatePath, string $publicPath): bool
    {
        $commands = [
            'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out '.escapeshellarg($privatePath),
            'openssl rsa -in '.escapeshellarg($privatePath).' -pubout -out '.escapeshellarg($publicPath),
        ];

        foreach ($commands as $command) {
            $output = [];
            $exitCode = 1;
            @exec($command.' 2>&1', $output, $exitCode);

            if ($exitCode !== 0) {
                @unlink($privatePath);
                @unlink($publicPath);

                return false;
            }
        }

        @chmod($privatePath, 0600);

        return is_file($privatePath) && is_file($publicPath);
    }
}
