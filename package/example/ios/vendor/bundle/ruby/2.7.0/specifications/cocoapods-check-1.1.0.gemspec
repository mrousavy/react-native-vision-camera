# -*- encoding: utf-8 -*-
# stub: cocoapods-check 1.1.0 ruby lib

Gem::Specification.new do |s|
  s.name = "cocoapods-check".freeze
  s.version = "1.1.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Matt Di Iorio".freeze]
  s.date = "2019-02-15"
  s.description = "'check' plugin for CocoaPods".freeze
  s.email = ["doo@squareup.com".freeze]
  s.homepage = "https://github.com/square/cocoapods-check".freeze
  s.rubygems_version = "3.1.6".freeze
  s.summary = "'check' plugin for CocoaPods".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_development_dependency(%q<bundler>.freeze, ["~> 1.0"])
    s.add_development_dependency(%q<rake>.freeze, ["~> 10.0"])
    s.add_development_dependency(%q<rspec>.freeze, [">= 0"])
    s.add_runtime_dependency(%q<cocoapods>.freeze, ["~> 1.0"])
  else
    s.add_dependency(%q<bundler>.freeze, ["~> 1.0"])
    s.add_dependency(%q<rake>.freeze, ["~> 10.0"])
    s.add_dependency(%q<rspec>.freeze, [">= 0"])
    s.add_dependency(%q<cocoapods>.freeze, ["~> 1.0"])
  end
end
