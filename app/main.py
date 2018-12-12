from app import app
import argparse

arg_parser = argparse.ArgumentParser(description='drug-reminder server')
arg_parser.add_argument('-p', '--port', help='set the server\'s port (default: 3000)',
    type=int, default=3000)
arg_parser.add_argument('-T', '--enable-test-upload', help='enable test upload form at /test-upload', 
    action='store_true', default=False)
arg_parser.add_argument('-k', '--keep-files', help='keep uploaded files instead of deleting them',
    action='store_true', default=False)

arguments = arg_parser.parse_args()
print(arguments)

exit()

print(f'starting app at port {arguments.port}')

app.config['TEST_UPLOAD_FORM'] = arguments.enable_test_upload
app.config['KEEP_FILES'] = arguments.keep_files

app.run(port=arguments.port)