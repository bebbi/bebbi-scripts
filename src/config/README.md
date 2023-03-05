# Just a Helpful Note

Any files that are needed in the compiled output, but are not `*.ts` files or
imported into other `*.ts` will not be compiled into the `dist` directory tree.

So for a workaround, any config file in this directory that you need copied into
the distrubted scripts package, prefix it with an underscore `_` and the
`postBuild` script will copy it to the distributed `config` directory without
the preceeding underscore prefix.
