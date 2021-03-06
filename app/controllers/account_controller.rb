class AccountController < ApplicationController

  before_filter :authenticate_user!
  before_filter :restrict_test_account
  layout 'account'

  def edit
    @user = current_user
    @page = 'edit'
  end

  def update
    @user = current_user
    u_params = params[:user]
    old_email = @user.email

    if u_params[:current_password].blank?
      flash[:alert] = t'account.enter_current_password'
    elsif @user.update_with_password(u_params)
      sign_in(@user, :bypass => true)
      flash[:notice] = t'account.updated_success'
      if @user.email != old_email
        UserMailer.email_changed_notice(@user, old_email).deliver
      end
    else
      error = @user.errors.first
      flash[:alert] = "Error: #{error[0].to_s.humanize} #{error[1]}"
    end
    redirect_to account_path
  end

  def change_password
    @user = current_user
    @page = 'password'
    if params[:user]
      @user = current_user
      u = params[:user]

      if u[:current_password].blank?
        flash.now[:alert] = t'account.enter_current_password'
      elsif u[:password].blank? || u[:password_confirmation].blank?
        flash[:alert] = t'account.enter_new_password'
      elsif @user.update_with_password(params[:user])
        sign_in(@user, :bypass => true)
        flash.now[:notice] = t'account.updated_success'
      else
        error = @user.errors.first
        flash.now[:alert] = "Error: #{error[0].to_s.humanize} #{error[1]}"
      end
    end
  end

end
