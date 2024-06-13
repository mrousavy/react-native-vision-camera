require 'cocoapods'
require 'tempfile'

require_relative '../lib/pod/command/check'

describe Pod::Command::Check do
  it 'detects no differences' do
    check = Pod::Command::Check.new(CLAide::ARGV.new([]))

    config = create_config({ :pod_one => '1.0', :pod_two => '2.0' }, { :pod_one => '1.0', :pod_two => '2.0' })

    development_pods = {}
    results = check.find_differences(config, development_pods)

    expect(results).to eq([])
  end

  it 'detects modifications and additions' do
    check = Pod::Command::Check.new(CLAide::ARGV.new([]))

    config = create_config(
        {
            :pod_one => '1.0',
            :pod_two => '3.0',
            :pod_three => '2.0'
        },
        {
            :pod_one => '1.0',
            :pod_two => '2.0',
            :pod_three => nil
        }
    )

    development_pods = {}
    results = check.find_differences(config, development_pods)

    # Alphabetical order
    expect(results).to eq([ '+pod_three', '~pod_two' ])
  end

  it 'detects modifications and additions with verbosity' do
    check = Pod::Command::Check.new(CLAide::ARGV.new([ '--verbose' ]))

    config = create_config(
        {
            :pod_one => '1.0',
            :pod_two => '3.0',
            :pod_three => '2.0'
        },
        {
            :pod_one => '1.0',
            :pod_two => '2.0',
            :pod_three => nil
        }
    )

    development_pods = {}
    results = check.find_differences(config, development_pods)

    # Alphabetical order
    expect(results).to eq([ 'pod_three newly added', 'pod_two 2.0 -> 3.0' ])
  end

  it 'handles development pods with changes' do
    check = Pod::Command::Check.new(CLAide::ARGV.new([]))

    config = create_config({ :pod_one => '1.0', :pod_two => '1.0' }, { :pod_one => '1.0', :pod_two => '1.0' })

    # Make an actual lockfile file because 'check' needs the modified time
    lockfile_path = Tempfile.new('dev-pod-test-lockfile').path
    allow(config.lockfile).to receive(:defined_in_file).and_return(lockfile_path)

    # Ensure development pod modified time is after lockfile modified time
    sleep(1)

    # Create a temp dir with a temp file and run the check in that context
    Dir.mktmpdir('dev-pod-test-dir') do |dir|

      # Create a source file
      source_file = Tempfile.new('some-pod-file', dir)

      # Write a podspec file pointing at the source file
      File.write("#{dir}/foo.podspec", "Pod::Spec.new do |s| s.source_files = '#{File.basename(source_file)}' end")

      # Do the check
      development_pods = { :pod_two => { :path => "#{dir}/foo.podspec" } }
      results = check.find_differences(config, development_pods)

      expect(results).to eq([ '~pod_two' ])
    end
  end

  it 'handles development pods no changes reported' do
    check = Pod::Command::Check.new(CLAide::ARGV.new([]))

    config = create_config({ :pod_one => '1.0', :pod_two => '1.0' }, { :pod_one => '1.0', :pod_two => '1.0' })

    # Create a temp dir with a temp file and run the check in that context
    Dir.mktmpdir('dev-pod-test-dir') do |dir|

      # Create a source file
      Tempfile.new('some-pod-file', dir)

      # Write a podspec file pointing at the source file
      File.write("#{dir}/foo.podspec", "Pod::Spec.new do |s| s.source_files = 'ack' end")

      # Ensure lockfile modified time is after development pod modified time
      sleep(1)

      # Make an actual lockfile file because 'check' needs the modified time
      lockfile_path = Tempfile.new('dev-pod-test-lockfile').path
      allow(config.lockfile).to receive(:defined_in_file).and_return(lockfile_path)

      # Do the check
      development_pods = { :pod_two => { :path => "#{dir}/foo.podspec" } }
      results = check.find_differences(config, development_pods)

      expect(results).to eq([])
    end
  end


  it 'handles ignoring development pods with changes' do
    check = Pod::Command::Check.new(CLAide::ARGV.new([ '--ignore-dev-pods' ]))

    config = create_config({ :pod_one => '1.0', :pod_two => '1.0' }, { :pod_one => '1.0', :pod_two => '1.0' })

    # Make an actual lockfile file because 'check' needs the modified time
    lockfile_path = Tempfile.new('dev-pod-test-lockfile').path
    allow(config.lockfile).to receive(:defined_in_file).and_return(lockfile_path)

    # Ensure development pod modified time is after lockfile modified time
    sleep(1)

    # Create a temp dir with a temp file and run the check in that context
    Dir.mktmpdir('dev-pod-test-dir') do |dir|

      # Create a source file
      source_file = Tempfile.new('some-pod-file', dir)

      # Write a podspec file pointing at the source file
      File.write("#{dir}/foo.podspec", "Pod::Spec.new do |s| s.source_files = '#{File.basename(source_file)}' end")

      # Do the check
      development_pods = { :pod_two => { :path => "#{dir}/foo.podspec" } }
      results = check.find_differences(config, development_pods)

      expect(results).to eq([])
    end
  end

  def create_config(lockfile_hash, manifest_hash)
    config = Pod::Config.new
    lockfile = double('lockfile')
    sandbox = double('sandbox')
    manifest = double('manifest')

    allow(config).to receive(:lockfile).and_return(lockfile)
    allow(config).to receive(:sandbox).and_return(sandbox)
    allow(sandbox).to receive(:manifest).and_return(manifest)

    allow(lockfile).to receive(:pod_names).and_return(lockfile_hash.keys)
    lockfile_hash.each do |key, value|
      allow(lockfile).to receive(:version).with(key).and_return(value)
    end

    manifest_hash.each do |key, value|
      allow(manifest).to receive(:version).with(key).and_return(value)
    end

    config
  end
end
