from setuptools import find_packages, setup

if __name__ == "__main__":
    setup(
        name='expressiveness_benchmark',
        version='0.1.0',
        description='TODO',
        url='http://github.com/willcrichton/expressiveness-benchmark',
        author='Will Crichton',
        author_email='wcrichto@cs.stanford.edu',
        license='Apache 2.0',
        packages=find_packages(),
        install_requires=['jupyter', 'dataclasses-json', 'pandas', 'tox'],
        zip_safe=False)
